window.MedievalSiege = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var MODULE_NAME = 'MedievalSiege';
  var ACTIVATION_WINDOW = 400;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    player: null,
    keys: {},
    keyTimes: {},
    castle: null,
    wallSections: [],
    cornerTowers: [],
    gatehouse: null,
    gateHP: 200,
    innerKeep: null,
    keepBreached: false,
    moat: null,
    throneRoom: null,
    trebuchet: null,
    trebuchetAngle: 0,
    trebuchetReload: 0,
    projectiles: [],
    batteringRam: null,
    ramCarriers: [],
    siegeTower: null,
    siegeTowerPos: null,
    drawbridge: null,
    ladders: [],
    activeLadder: null,
    archers: [],
    meleeGuards: [],
    knight: null,
    knightHP: 250,
    king: null,
    kingHP: 400,
    allySoldiers: [],
    arrows: [],
    rubbleGaps: [],
    hudEl: null,
    siegeEngines: { trebuchet: true, ram: true, tower: true },
    mKeyTime: 0,
    sKeyTime: 0,
    playerOnLadder: false,
    ladderClimb: 0,
    animFrame: null
  };

  /* ──────────────────────────────────────────────
     ACTIVATION: M+S within 400ms
  ────────────────────────────────────────────── */
  function onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    var now = Date.now();
    if (key === 'm') { state.mKeyTime = now; }
    if (key === 's') { state.sKeyTime = now; }
    if (key === 'm' || key === 's') {
      if (Math.abs(state.mKeyTime - state.sKeyTime) <= ACTIVATION_WINDOW &&
          state.mKeyTime > 0 && state.sKeyTime > 0) {
        if (!state.active) { activate(); }
        state.mKeyTime = 0;
        state.sKeyTime = 0;
      }
    }
    if (state.active) {
      state.keys[key] = true;
      state.keyTimes[key] = now;
      handleActionKey(key);
    }
  }

  function onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    state.keys[key] = false;
  }

  /* ──────────────────────────────────────────────
     ACTIVATION / DEACTIVATION
  ────────────────────────────────────────────── */
  function activate() {
    if (state.active) { return; }
    state.active = true;
    buildScene();
    buildHUD();
    state.animFrame = requestAnimationFrame(loop);
  }

  function deactivate() {
    if (!state.active) { return; }
    state.active = false;
    if (state.animFrame) { cancelAnimationFrame(state.animFrame); state.animFrame = null; }
    if (state.renderer && state.renderer.domElement && state.renderer.domElement.parentNode) {
      state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
    }
    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
    }
    state.renderer = null;
    state.scene = null;
    state.hudEl = null;
  }

  /* ──────────────────────────────────────────────
     SCENE CONSTRUCTION
  ────────────────────────────────────────────── */
  function buildScene() {
    var THREE = window.THREE;
    if (!THREE) { alert(MODULE_NAME + ': THREE.js not found'); return; }

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x7799bb);
    state.scene.fog = new THREE.Fog(0x7799bb, 60, 200);

    state.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
    state.camera.position.set(0, 8, 60);
    state.camera.lookAt(0, 4, 0);

    state.clock = new THREE.Clock();

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    /* Lighting */
    var ambient = new THREE.AmbientLight(0x886644, 0.7);
    state.scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xffddaa, 1.2);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    state.scene.add(sun);

    /* Ground */
    var groundGeo = new THREE.PlaneGeometry(300, 300);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x557733 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    state.scene.add(ground);

    buildCastle(THREE);
    buildSiegeEquipment(THREE);
    buildDefenders(THREE);
    buildAllies(THREE);
    buildPlayer(THREE);
  }

  function makeMesh(THREE, geo, color, castShadow, receiveShadow) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    if (castShadow) { mesh.castShadow = true; }
    if (receiveShadow) { mesh.receiveShadow = true; }
    return mesh;
  }

  /* ──────────────────────────────────────────────
     CASTLE
  ────────────────────────────────────────────── */
  function buildCastle(THREE) {
    state.castle = new THREE.Group();
    state.scene.add(state.castle);
    state.wallSections = [];

    /* Perimeter walls: N/S/E/W, each 50x10x2 */
    var wallDefs = [
      { x: 0,   y: 5, z: -26, rx: 0,          rz: 0 },   /* North */
      { x: 0,   y: 5, z:  26, rx: 0,          rz: 0 },   /* South */
      { x: -26, y: 5, z:  0,  rx: 0, ry: Math.PI/2, rz: 0 }, /* West */
      { x:  26, y: 5, z:  0,  rx: 0, ry: Math.PI/2, rz: 0 }  /* East */
    ];
    for (var i = 0; i < wallDefs.length; i++) {
      var wd = wallDefs[i];
      /* Each wall is split into 5 sections of 10x10x2 for breach mechanics */
      for (var s = 0; s < 5; s++) {
        var geo = new THREE.BoxGeometry(10, 10, 2);
        var wall = makeMesh(THREE, geo, 0x887766, true, true);
        var offset = (s - 2) * 10;
        if (wd.ry) {
          wall.position.set(wd.x, wd.y, wd.z + offset);
          wall.rotation.y = wd.ry;
        } else {
          wall.position.set(wd.x + offset, wd.y, wd.z);
        }
        wall.userData = { hp: 80, side: i, section: s, destroyed: false };
        state.castle.add(wall);
        state.wallSections.push(wall);
      }
    }

    /* 4 corner towers CylinderGeometry r=3 h=14 */
    var corners = [
      { x: -26, z: -26 }, { x: 26, z: -26 },
      { x: -26, z:  26 }, { x: 26, z:  26 }
    ];
    for (var c = 0; c < corners.length; c++) {
      var tGeo = new THREE.CylinderGeometry(3, 3, 14, 10);
      var tower = makeMesh(THREE, tGeo, 0x776655, true, true);
      tower.position.set(corners[c].x, 7, corners[c].z);
      state.castle.add(tower);
      state.cornerTowers.push(tower);
    }

    /* Gatehouse BoxGeometry 8x12x6 at south wall center */
    var ghGeo = new THREE.BoxGeometry(8, 12, 6);
    state.gatehouse = makeMesh(THREE, ghGeo, 0x665544, true, true);
    state.gatehouse.position.set(0, 6, 26);
    state.castle.add(state.gatehouse);

    /* Portcullis as LineSegments */
    var portGeo = new THREE.BufferGeometry();
    var portVerts = [];
    for (var pg = 0; pg < 5; pg++) {
      portVerts.push(-3, pg * 1.5, 26.1, 3, pg * 1.5, 26.1);
    }
    for (var pv = 0; pv < 4; pv++) {
      portVerts.push(-3 + pv * 2, 0, 26.1, -3 + pv * 2, 6, 26.1);
    }
    portGeo.setAttribute('position', new THREE.Float32BufferAttribute(portVerts, 3));
    var portMat = new THREE.LineBasicMaterial({ color: 0x888844 });
    var portcullis = new THREE.LineSegments(portGeo, portMat);
    state.castle.add(portcullis);
    state.gatehouse.userData = { portcullis: portcullis, open: false };

    /* Inner keep 15x15x12 */
    var keepGeo = new THREE.BoxGeometry(15, 15, 12);
    state.innerKeep = makeMesh(THREE, keepGeo, 0x554433, true, true);
    state.innerKeep.position.set(0, 7.5, -10);
    state.castle.add(state.innerKeep);

    /* Throne room inside keep */
    var throneGeo = new THREE.BoxGeometry(10, 5, 8);
    state.throneRoom = makeMesh(THREE, throneGeo, 0x554433, true, true);
    state.throneRoom.position.set(0, 4.5, -10);
    state.scene.add(state.throneRoom); /* placed in scene, slightly inside keep */

    /* Moat PlaneGeometry surrounding outer wall */
    var moatGeo = new THREE.PlaneGeometry(80, 80);
    var moatMat = new THREE.MeshLambertMaterial({ color: 0x113355, transparent: true, opacity: 0.85 });
    var moat = new THREE.Mesh(moatGeo, moatMat);
    moat.rotation.x = -Math.PI / 2;
    moat.position.set(0, 0.05, 0);
    /* Inner cutout approximated by keeping it behind the ground slightly */
    state.moat = moat;
    state.scene.add(moat);
  }

  /* ──────────────────────────────────────────────
     SIEGE EQUIPMENT
  ────────────────────────────────────────────── */
  function buildSiegeEquipment(THREE) {
    /* Trebuchet */
    var trebGroup = new THREE.Group();
    var trebBody = makeMesh(THREE, new THREE.BoxGeometry(4, 3, 2), 0x885533, true, true);
    trebBody.position.set(0, 1.5, 0);
    trebGroup.add(trebBody);
    /* Wheels */
    for (var tw = -1; tw <= 1; tw += 2) {
      var wGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.3, 10);
      var wheel = makeMesh(THREE, wGeo, 0x443322, true, false);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(tw * 1.5, 0.7, 0);
      trebGroup.add(wheel);
    }
    /* Arm */
    var armGeo = new THREE.BoxGeometry(0.3, 5, 0.3);
    var arm = makeMesh(THREE, armGeo, 0x664422, true, false);
    arm.position.set(0, 4.5, 0);
    trebGroup.add(arm);
    trebGroup.position.set(-20, 0, 45);
    state.scene.add(trebGroup);
    state.trebuchet = trebGroup;
    state.trebuchetAngle = 0;
    state.trebuchetReload = 0;

    /* Battering ram BoxGeometry 8x1x1 */
    var ramGroup = new THREE.Group();
    var ramBeam = makeMesh(THREE, new THREE.BoxGeometry(8, 1, 1), 0x885533, true, true);
    ramBeam.position.set(0, 2, 0);
    ramGroup.add(ramBeam);
    /* 4 carrier soldiers */
    state.ramCarriers = [];
    var carrierPositions = [
      { x: -2.5, z: -0.8 }, { x: -2.5, z: 0.8 },
      { x:  2.5, z: -0.8 }, { x:  2.5, z: 0.8 }
    ];
    for (var rc = 0; rc < 4; rc++) {
      var cGeo = new THREE.BoxGeometry(0.6, 1.6, 0.6);
      var carrier = makeMesh(THREE, cGeo, 0x334422, true, true);
      carrier.position.set(carrierPositions[rc].x, 0.8, carrierPositions[rc].z);
      carrier.userData = { hp: 40, alive: true };
      ramGroup.add(carrier);
      state.ramCarriers.push(carrier);
    }
    ramGroup.position.set(0, 0, 50);
    state.scene.add(ramGroup);
    state.batteringRam = ramGroup;

    /* Siege tower BoxGeometry 4x14x4 */
    var towerGroup = new THREE.Group();
    var towerBody = makeMesh(THREE, new THREE.BoxGeometry(4, 14, 4), 0x887766, true, true);
    towerBody.position.set(0, 7, 0);
    towerGroup.add(towerBody);
    /* Wheels */
    for (var stw = -1; stw <= 1; stw += 2) {
      var stwGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 10);
      var stwWheel = makeMesh(THREE, stwGeo, 0x443322, true, false);
      stwWheel.rotation.z = Math.PI / 2;
      stwWheel.position.set(stw * 2.2, 0.8, 0);
      towerGroup.add(stwWheel);
    }
    /* Drawbridge at top */
    var dbGeo = new THREE.BoxGeometry(4, 0.3, 5);
    state.drawbridge = makeMesh(THREE, dbGeo, 0x664422, true, false);
    state.drawbridge.position.set(0, 14.15, -2.5);
    state.drawbridge.userData = { deployed: false };
    towerGroup.add(state.drawbridge);
    towerGroup.position.set(20, 0, 50);
    state.scene.add(towerGroup);
    state.siegeTower = towerGroup;
    state.siegeTowerPos = towerGroup.position.clone();
  }

  /* ──────────────────────────────────────────────
     DEFENDERS
  ────────────────────────────────────────────── */
  function buildDefenders(THREE) {
    state.archers = [];
    /* 16 archers on walls/towers */
    var archerPositions = [
      { x: -20, y: 11, z: -26 }, { x: -10, y: 11, z: -26 },
      { x:  0,  y: 11, z: -26 }, { x:  10, y: 11, z: -26 },
      { x:  20, y: 11, z: -26 }, { x: -20, y: 11, z:  26 },
      { x:  10, y: 11, z:  26 }, { x:  20, y: 11, z:  26 },
      { x: -26, y: 11, z: -10 }, { x: -26, y: 11, z:  10 },
      { x:  26, y: 11, z: -10 }, { x:  26, y: 11, z:  10 },
      { x: -26, y: 14, z: -26 }, { x:  26, y: 14, z: -26 },
      { x: -26, y: 14, z:  26 }, { x:  26, y: 14, z:  26 }
    ];
    for (var a = 0; a < 16; a++) {
      var aGeo = new THREE.BoxGeometry(0.7, 1.7, 0.7);
      var archer = makeMesh(THREE, aGeo, 0x334433, true, true);
      archer.position.set(archerPositions[a].x, archerPositions[a].y, archerPositions[a].z);
      archer.userData = { hp: 30, alive: true, shootTimer: Math.random() * 3 };
      state.scene.add(archer);
      state.archers.push(archer);
    }

    /* 4 melee guards at gate */
    state.meleeGuards = [];
    var guardPositions = [
      { x: -1.5, z: 28 }, { x: 1.5, z: 28 },
      { x: -1.5, z: 24 }, { x: 1.5, z: 24 }
    ];
    for (var g = 0; g < 4; g++) {
      var gGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
      var guard = makeMesh(THREE, gGeo, 0x334433, true, true);
      guard.position.set(guardPositions[g].x, 0.9, guardPositions[g].z);
      guard.userData = { hp: 50, alive: true };
      state.scene.add(guard);
      state.meleeGuards.push(guard);
    }

    /* Knight in keep */
    var knightGeo = new THREE.BoxGeometry(1.2, 2.1, 1.2);
    state.knight = makeMesh(THREE, knightGeo, 0x223322, true, true);
    state.knight.position.set(0, 1.05, -10);
    state.knight.userData = { hp: 250, alive: true };
    state.scene.add(state.knight);
    state.knightHP = 250;

    /* King in throne room */
    var kingGeo = new THREE.BoxGeometry(1.4, 2.4, 1.4);
    state.king = makeMesh(THREE, kingGeo, 0x221133, true, true);
    state.king.position.set(0, 1.2, -10);
    state.king.userData = { hp: 400, alive: true, captured: false };
    state.scene.add(state.king);
    state.kingHP = 400;
  }

  /* ──────────────────────────────────────────────
     ALLIED SOLDIERS
  ────────────────────────────────────────────── */
  function buildAllies(THREE) {
    state.allySoldiers = [];
    for (var al = 0; al < 10; al++) {
      var alGeo = new THREE.BoxGeometry(0.7, 1.7, 0.7);
      var ally = makeMesh(THREE, alGeo, 0x334422, true, true);
      ally.position.set(-8 + al * 1.8, 0.85, 55);
      ally.userData = {
        hp: 50, alive: true, target: null,
        mode: 'follow', /* follow | attackGate | manTrebuchet */
        attackTimer: 0
      };
      state.scene.add(ally);
      state.allySoldiers.push(ally);
    }
  }

  /* ──────────────────────────────────────────────
     PLAYER
  ────────────────────────────────────────────── */
  function buildPlayer(THREE) {
    var pGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var pMat = new THREE.MeshLambertMaterial({ color: 0x224488 });
    state.player = new THREE.Mesh(pGeo, pMat);
    state.player.position.set(0, 0.9, 55);
    state.player.castShadow = true;
    state.player.userData = { hp: 100, speed: 8, ladderClimb: 0 };
    state.scene.add(state.player);
  }

  /* ──────────────────────────────────────────────
     ACTION KEYS (instant triggers)
  ────────────────────────────────────────────── */
  function handleActionKey(key) {
    if (key === ' ') { fireTrebuchet(); }
    if (key === 'l') { placeLadder(); }
    if (key === 'e') { issueOrder(); }
    if (key === 'escape') { deactivate(); }
  }

  function fireTrebuchet() {
    var THREE = window.THREE;
    if (!THREE || !state.trebuchet) { return; }
    if (state.trebuchetReload > 0) { return; }
    state.trebuchetReload = 8;

    var rGeo = new THREE.SphereGeometry(0.8, 8, 8);
    var rock = makeMesh(THREE, rGeo, 0x665544, true, false);
    var tp = state.trebuchet.position.clone();
    rock.position.set(tp.x, tp.y + 5, tp.z);
    var angle = state.trebuchetAngle;
    rock.userData = {
      type: 'trebuchetRock',
      vx: Math.sin(angle) * 18,
      vy: 12,
      vz: -Math.cos(angle) * 18,
      alive: true
    };
    state.scene.add(rock);
    state.projectiles.push(rock);
  }

  function placeLadder() {
    var THREE = window.THREE;
    if (!THREE) { return; }
    var pp = state.player.position;
    /* Check proximity to wall (z ~ 26 or -26, or x ~ 26 or -26) */
    var nearWall = (Math.abs(pp.z - 26) < 6) || (Math.abs(pp.z + 26) < 6) ||
                   (Math.abs(pp.x - 26) < 6) || (Math.abs(pp.x + 26) < 6);
    if (!nearWall) { return; }

    var lGeo = new THREE.CylinderGeometry(0.15, 0.15, 12, 6);
    var ladder = makeMesh(THREE, lGeo, 0x885533, true, true);
    /* Lean toward nearest wall */
    var lz = pp.z;
    var lx = pp.x;
    if (Math.abs(lz - 26) < 6) {
      ladder.position.set(lx, 6, 24);
      ladder.rotation.x = Math.PI / 10;
    } else if (Math.abs(lz + 26) < 6) {
      ladder.position.set(lx, 6, -24);
      ladder.rotation.x = -Math.PI / 10;
    } else if (Math.abs(lx - 26) < 6) {
      ladder.position.set(24, 6, lz);
      ladder.rotation.z = Math.PI / 10;
    } else {
      ladder.position.set(-24, 6, lz);
      ladder.rotation.z = -Math.PI / 10;
    }
    ladder.userData = { climbable: true };
    state.scene.add(ladder);
    state.ladders.push(ladder);
    state.activeLadder = ladder;
    state.playerOnLadder = true;
    state.ladderClimb = 0;
  }

  function issueOrder() {
    var pp = state.player.position;
    /* E near siege tower = man trebuchet */
    if (state.trebuchet) {
      var tp = state.trebuchet.position;
      if (pp.distanceTo(tp) < 8) {
        for (var i = 0; i < state.allySoldiers.length; i++) {
          if (state.allySoldiers[i].userData.alive) {
            state.allySoldiers[i].userData.mode = 'manTrebuchet';
          }
        }
        return;
      }
    }
    /* Default: attack gate */
    for (var j = 0; j < state.allySoldiers.length; j++) {
      if (state.allySoldiers[j].userData.alive) {
        state.allySoldiers[j].userData.mode = 'attackGate';
      }
    }
  }

  /* ──────────────────────────────────────────────
     MAIN LOOP
  ────────────────────────────────────────────── */
  function loop() {
    if (!state.active) { return; }
    state.animFrame = requestAnimationFrame(loop);
    var dt = Math.min(state.clock.getDelta(), 0.05);
    update(dt);
    state.renderer.render(state.scene, state.camera);
  }

  function update(dt) {
    updatePlayer(dt);
    updateTrebuchet(dt);
    updateBatteringRam(dt);
    updateSiegeTower(dt);
    updateProjectiles(dt);
    updateArchers(dt);
    updateAllies(dt);
    updateHUD();
  }

  /* ──────────────────────────────────────────────
     PLAYER UPDATE
  ────────────────────────────────────────────── */
  function updatePlayer(dt) {
    var pp = state.player.position;
    var speed = state.player.userData.speed;

    if (state.playerOnLadder && state.activeLadder) {
      if (state.keys['w']) {
        state.ladderClimb += dt * 3;
        pp.y = 0.9 + state.ladderClimb;
        if (pp.y > 11) {
          state.playerOnLadder = false;
          pp.y = 11;
        }
      }
      if (state.keys['s']) {
        state.ladderClimb -= dt * 3;
        if (state.ladderClimb < 0) { state.ladderClimb = 0; }
        pp.y = 0.9 + state.ladderClimb;
        if (state.ladderClimb <= 0) { state.playerOnLadder = false; }
      }
    } else {
      if (state.keys['w']) { pp.z -= speed * dt; }
      if (state.keys['s']) { pp.z += speed * dt; }
      if (state.keys['a']) { pp.x -= speed * dt; }
      if (state.keys['d']) { pp.x += speed * dt; }
      /* Gravity / floor */
      if (pp.y > 0.9) { pp.y -= 9.8 * dt; }
      if (pp.y < 0.9) { pp.y = 0.9; }
    }

    /* Camera follow */
    state.camera.position.set(pp.x, pp.y + 8, pp.z + 18);
    state.camera.lookAt(pp.x, pp.y + 2, pp.z);
  }

  /* ──────────────────────────────────────────────
     TREBUCHET
  ────────────────────────────────────────────── */
  function updateTrebuchet(dt) {
    if (!state.trebuchet) { return; }
    if (state.trebuchetReload > 0) { state.trebuchetReload -= dt; }

    var pp = state.player.position;
    var tp = state.trebuchet.position;
    if (pp.distanceTo(tp) < 5) {
      if (state.keys['a']) { state.trebuchetAngle -= dt * 1.2; }
      if (state.keys['d']) { state.trebuchetAngle += dt * 1.2; }
    }
  }

  /* ──────────────────────────────────────────────
     BATTERING RAM
  ────────────────────────────────────────────── */
  function updateBatteringRam(dt) {
    if (!state.batteringRam) { return; }
    var pp = state.player.position;
    var rp = state.batteringRam.position;
    /* Player must be near ram and pressing W */
    if (pp.distanceTo(rp) < 5 && state.keys['w']) {
      /* Count living carriers */
      var alive = 0;
      for (var i = 0; i < state.ramCarriers.length; i++) {
        if (state.ramCarriers[i].userData.alive) { alive++; }
      }
      var pushSpeed = (alive / 4) * 4;
      rp.z -= pushSpeed * dt;
      /* Check gate collision */
      if (rp.z <= 28 && rp.z > 22) {
        if (state.gateHP > 0) {
          state.gateHP -= alive * 10 * dt;
          if (state.gateHP < 0) { state.gateHP = 0; }
        }
      }
    }
  }

  /* ──────────────────────────────────────────────
     SIEGE TOWER
  ────────────────────────────────────────────── */
  function updateSiegeTower(dt) {
    if (!state.siegeTower) { return; }
    var pp = state.player.position;
    var sp = state.siegeTower.position;
    if (pp.distanceTo(sp) < 6 && state.keys['w']) {
      sp.z -= 3 * dt;
      /* Deploy drawbridge when close to wall */
      if (sp.z <= 29 && !state.drawbridge.userData.deployed) {
        state.drawbridge.userData.deployed = true;
        state.drawbridge.rotation.x = -Math.PI / 2;
        state.drawbridge.position.z = -5;
      }
    }
  }

  /* ──────────────────────────────────────────────
     PROJECTILES
  ────────────────────────────────────────────── */
  function updateProjectiles(dt) {
    var THREE = window.THREE;
    var i, proj, px, py, pz;
    for (i = state.projectiles.length - 1; i >= 0; i--) {
      proj = state.projectiles[i];
      if (!proj.userData.alive) {
        state.scene.remove(proj);
        state.projectiles.splice(i, 1);
        continue;
      }
      proj.userData.vy -= 9.8 * dt;
      proj.position.x += proj.userData.vx * dt;
      proj.position.y += proj.userData.vy * dt;
      proj.position.z += proj.userData.vz * dt;

      /* Ground hit */
      if (proj.position.y < 0.8) {
        proj.userData.alive = false;
        spawnRubble(THREE, proj.position);
        continue;
      }

      /* Check wall hits */
      if (proj.userData.type === 'trebuchetRock') {
        checkRockWallHit(proj, THREE);
      } else if (proj.userData.type === 'arrow') {
        checkArrowHit(proj);
      }
    }

    /* Arrows */
    for (i = state.arrows.length - 1; i >= 0; i--) {
      var arr = state.arrows[i];
      if (!arr.userData.alive) {
        state.scene.remove(arr);
        state.arrows.splice(i, 1);
        continue;
      }
      arr.userData.vy -= 9.8 * dt;
      arr.position.x += arr.userData.vx * dt;
      arr.position.y += arr.userData.vy * dt;
      arr.position.z += arr.userData.vz * dt;
      if (arr.position.y < 0) { arr.userData.alive = false; }
      checkArrowHit(arr);
    }
  }

  function checkRockWallHit(rock, THREE) {
    for (var w = 0; w < state.wallSections.length; w++) {
      var ws = state.wallSections[w];
      if (ws.userData.destroyed) { continue; }
      var wp = ws.position;
      var dx = Math.abs(rock.position.x - wp.x);
      var dy = Math.abs(rock.position.y - wp.y);
      var dz = Math.abs(rock.position.z - wp.z);
      if (dx < 6 && dy < 6 && dz < 3) {
        ws.userData.hp -= 30;
        rock.userData.alive = false;
        spawnRubble(THREE, rock.position);
        if (ws.userData.hp <= 0) {
          ws.userData.destroyed = true;
          ws.visible = false;
          /* Create passable gap */
          state.rubbleGaps.push({ x: ws.position.x, z: ws.position.z, side: ws.userData.side });
          spawnRubble(THREE, ws.position);
        }
        return;
      }
    }
  }

  function checkArrowHit(arrow) {
    var pp = state.player.position;
    var dist = arrow.position.distanceTo(pp);
    if (dist < 1.2) {
      state.player.userData.hp -= 8;
      arrow.userData.alive = false;
      if (state.player.userData.hp <= 0) {
        state.player.userData.hp = 0;
        showMessage('You have fallen! Press ESC to exit siege.');
      }
      return;
    }
    /* Hit ally soldiers */
    for (var al = 0; al < state.allySoldiers.length; al++) {
      var ally = state.allySoldiers[al];
      if (!ally.userData.alive) { continue; }
      if (arrow.position.distanceTo(ally.position) < 1.2) {
        ally.userData.hp -= 8;
        arrow.userData.alive = false;
        if (ally.userData.hp <= 0) {
          ally.userData.alive = false;
          ally.visible = false;
        }
        return;
      }
    }
    /* Hit ram carriers */
    for (var rc = 0; rc < state.ramCarriers.length; rc++) {
      var carrier = state.ramCarriers[rc];
      if (!carrier.userData.alive) { continue; }
      var worldPos = carrier.getWorldPosition(new window.THREE.Vector3());
      if (arrow.position.distanceTo(worldPos) < 1.0) {
        carrier.userData.hp -= 15;
        arrow.userData.alive = false;
        if (carrier.userData.hp <= 0) {
          carrier.userData.alive = false;
          carrier.visible = false;
        }
        return;
      }
    }
  }

  function spawnRubble(THREE, pos) {
    for (var r = 0; r < 4; r++) {
      var rGeo = new THREE.BoxGeometry(
        0.5 + Math.random() * 1,
        0.3 + Math.random() * 0.5,
        0.5 + Math.random() * 1
      );
      var rubble = makeMesh(THREE, rGeo, 0x665544, false, true);
      rubble.position.set(
        pos.x + (Math.random() - 0.5) * 3,
        0.3,
        pos.z + (Math.random() - 0.5) * 3
      );
      rubble.rotation.y = Math.random() * Math.PI;
      state.scene.add(rubble);
    }
  }

  /* ──────────────────────────────────────────────
     ARCHERS AI
  ────────────────────────────────────────────── */
  function updateArchers(dt) {
    var THREE = window.THREE;
    if (!THREE) { return; }
    for (var a = 0; a < state.archers.length; a++) {
      var archer = state.archers[a];
      if (!archer.userData.alive) { continue; }
      archer.userData.shootTimer -= dt;
      if (archer.userData.shootTimer <= 0) {
        archer.userData.shootTimer = 2 + Math.random() * 2;
        shootArrow(THREE, archer.position, state.player.position);
      }
    }
  }

  function shootArrow(THREE, from, to) {
    var aGeo = new THREE.SphereGeometry(0.1, 4, 4);
    var arrow = makeMesh(THREE, aGeo, 0x886633, false, false);
    arrow.position.copy(from);
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var dz = to.z - from.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var speed = 16;
    var t = dist / speed;
    arrow.userData = {
      type: 'arrow',
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed + 9.8 * t * 0.5,
      vz: (dz / dist) * speed,
      alive: true
    };
    state.scene.add(arrow);
    state.arrows.push(arrow);
  }

  /* ──────────────────────────────────────────────
     ALLIED AI
  ────────────────────────────────────────────── */
  function updateAllies(dt) {
    var pp = state.player.position;
    for (var i = 0; i < state.allySoldiers.length; i++) {
      var ally = state.allySoldiers[i];
      if (!ally.userData.alive) { continue; }
      var ap = ally.position;
      var mode = ally.userData.mode;

      if (mode === 'follow') {
        var dx = pp.x - ap.x;
        var dz = pp.z - ap.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 8 && dist < 80) {
          ap.x += (dx / dist) * 3.5 * dt;
          ap.z += (dz / dist) * 3.5 * dt;
        }
      } else if (mode === 'attackGate') {
        var tx = 0, tz = 26;
        var gdx = tx - ap.x, gdz = tz - ap.z;
        var gdist = Math.sqrt(gdx * gdx + gdz * gdz);
        if (gdist > 2) {
          ap.x += (gdx / gdist) * 3 * dt;
          ap.z += (gdz / gdist) * 3 * dt;
        } else {
          /* Attack gate */
          ally.userData.attackTimer -= dt;
          if (ally.userData.attackTimer <= 0) {
            ally.userData.attackTimer = 1;
            if (state.gateHP > 0) {
              state.gateHP -= 5;
              if (state.gateHP < 0) { state.gateHP = 0; }
            }
          }
          /* Attack melee guards */
          for (var g = 0; g < state.meleeGuards.length; g++) {
            var guard = state.meleeGuards[g];
            if (!guard.userData.alive) { continue; }
            if (ally.position.distanceTo(guard.position) < 2) {
              guard.userData.hp -= 3 * dt;
              if (guard.userData.hp <= 0) {
                guard.userData.alive = false;
                guard.visible = false;
              }
            }
          }
        }
      } else if (mode === 'manTrebuchet') {
        var tp = state.trebuchet.position;
        var tdx = tp.x - ap.x, tdz = tp.z - ap.z;
        var tdist = Math.sqrt(tdx * tdx + tdz * tdz);
        if (tdist > 3) {
          ap.x += (tdx / tdist) * 3 * dt;
          ap.z += (tdz / tdist) * 3 * dt;
        } else {
          /* Auto-fire trebuchet toward castle */
          ally.userData.attackTimer -= dt;
          if (ally.userData.attackTimer <= 0 && state.trebuchetReload <= 0) {
            ally.userData.attackTimer = 8;
            state.trebuchetAngle = 0;
            fireTrebuchet();
          }
        }
      }
      /* Attack melee guards when close */
      if (mode === 'follow') {
        for (var mg = 0; mg < state.meleeGuards.length; mg++) {
          var mguard = state.meleeGuards[mg];
          if (!mguard.userData.alive) { continue; }
          if (ally.position.distanceTo(mguard.position) < 2) {
            mguard.userData.hp -= 5 * dt;
            if (mguard.userData.hp <= 0) {
              mguard.userData.alive = false;
              mguard.visible = false;
            }
          }
        }
      }
    }

    /* Check keep breached */
    if (state.gateHP <= 0 && !state.keepBreached) {
      var alliesInside = false;
      for (var ai = 0; ai < state.allySoldiers.length; ai++) {
        if (state.allySoldiers[ai].userData.alive &&
            Math.abs(state.allySoldiers[ai].position.z) < 24 &&
            Math.abs(state.allySoldiers[ai].position.z) > 0) {
          alliesInside = true;
          break;
        }
      }
      if (alliesInside || pp.z < 24) {
        state.keepBreached = true;
      }
    }

    /* Check king capture */
    if (state.king && state.king.userData.alive && !state.king.userData.captured) {
      if (pp.distanceTo(state.king.position) < 2.5) {
        state.king.userData.captured = true;
        state.king.visible = false;
        showMessage('THE KING HAS BEEN CAPTURED! SIEGE VICTORY!');
      }
    }
  }

  /* ──────────────────────────────────────────────
     HUD
  ────────────────────────────────────────────── */
  function buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'medieval-siege-hud';
    hud.style.cssText = [
      'position:fixed',
      'bottom:0',
      'left:0',
      'right:0',
      'background:rgba(0,0,0,0.72)',
      'color:#ddcc88',
      'font:bold 13px monospace',
      'padding:6px 12px',
      'z-index:9999',
      'pointer-events:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(hud);
    state.hudEl = hud;

    /* Controls hint */
    var hint = document.createElement('div');
    hint.style.cssText = 'position:fixed;top:8px;left:8px;background:rgba(0,0,0,0.6);color:#aabbcc;font:11px monospace;padding:6px 10px;z-index:9999;pointer-events:none;line-height:1.6';
    hint.innerHTML = [
      '<b>MEDIEVAL SIEGE</b>',
      'WASD: Move | SPACE: Fire trebuchet | A/D near trebuchet: Aim',
      'W near ram: Push | W near siege tower: Roll tower',
      'L: Place ladder | W on ladder: Climb',
      'E: Order allies (attack gate) | E near trebuchet: Man trebuchet',
      'ESC: Exit siege'
    ].join('<br>');
    document.body.appendChild(hint);
    state.hudEl._hint = hint;
  }

  function updateHUD() {
    if (!state.hudEl) { return; }
    var archersAlive = 0;
    for (var a = 0; a < state.archers.length; a++) {
      if (state.archers[a].userData.alive) { archersAlive++; }
    }
    var alliesAlive = 0;
    for (var al = 0; al < state.allySoldiers.length; al++) {
      if (state.allySoldiers[al].userData.alive) { alliesAlive++; }
    }
    var gateStr = 'GATE: ' + Math.max(0, Math.floor(state.gateHP)) + 'HP';
    var keepStr = 'KEEP: ' + (state.keepBreached ? 'BREACHED' : 'SEALED');
    var archStr = 'ARCHERS: ' + archersAlive;
    var allyStr = 'ALLIES: ' + alliesAlive + '/10';
    var engStr = 'SIEGE ENGINES: trebuchet/ram/tower';
    var kingStr = state.king && state.king.userData.captured ? 'KING: CAPTURED' : 'KING: AT LARGE';
    var reloadStr = state.trebuchetReload > 0
      ? ' [TREBUCHET RELOAD: ' + Math.ceil(state.trebuchetReload) + 's]'
      : ' [TREBUCHET READY]';
    var hpStr = ' HP: ' + Math.max(0, state.player.userData.hp);

    state.hudEl.textContent = 'SIEGE [' + gateStr + '] [' + keepStr + '] [' + archStr + '] [' + allyStr + '] [' + engStr + ']' + reloadStr + ' | ' + kingStr + hpStr;
  }

  /* ──────────────────────────────────────────────
     UTILITIES
  ────────────────────────────────────────────── */
  function showMessage(msg) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#ffdd88;font:bold 22px monospace;padding:20px 32px;z-index:10000;text-align:center;border:2px solid #886622;';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, 5000);
  }

  /* ──────────────────────────────────────────────
     WINDOW RESIZE
  ────────────────────────────────────────────── */
  function onResize() {
    if (!state.active || !state.renderer || !state.camera) { return; }
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /* ──────────────────────────────────────────────
     INIT (attach listeners once)
  ────────────────────────────────────────────── */
  window.addEventListener('keydown', onKeyDown, false);
  window.addEventListener('keyup', onKeyUp, false);
  window.addEventListener('resize', onResize, false);

  return {
    activate: activate,
    deactivate: deactivate,
    getState: function () { return state; }
  };
}());
