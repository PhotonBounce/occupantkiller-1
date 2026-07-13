window.ColiseumBattle = (function() {
  'use strict';

  var scene, camera;
  var fighters = [];
  var enemies = [];
  var crowdBoxes = [];
  var trapDoors = [];
  var catapults = [];
  var time = 0;

  var state = {
    gladiatorCount: 5,
    enemyCount: 4,
    crowdFavor: 50,
    hPressed: false,
    oPressed: false,
    hPressTime: 0,
    hudVisible: false
  };

  function createArenaFloor() {
    var floorGeometry = new THREE.BoxGeometry(80, 0.3, 60);
    var floorMaterial = new THREE.MeshPhongMaterial({ color: 0xc8a060 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    scene.add(floor);
    return floor;
  }

  function createColiseumWall() {
    var wallGeometry = new THREE.BoxGeometry(90, 25, 3);
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });

    var segments = 20;
    var radius = 45;

    for (var i = 0; i < segments; i++) {
      var angle = (i / segments) * Math.PI * 2;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var wallSegment = new THREE.Mesh(wallGeometry, wallMaterial);
      wallSegment.position.set(x, 12.5, z);
      wallSegment.rotation.y = angle;
      wallSegment.scale.set(0.25, 1, 1);
      scene.add(wallSegment);

      if (i % 5 === 0) {
        createArchedWindow(x, z, angle);
      }
    }
  }

  function createArchedWindow(x, z, angle) {
    var windowFrameGeometry = new THREE.BoxGeometry(6, 8, 0.5);
    var windowMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var windowFrame = new THREE.Mesh(windowFrameGeometry, windowMaterial);
    windowFrame.position.set(x * 1.02, 15, z * 1.02);
    windowFrame.rotation.y = angle;
    scene.add(windowFrame);
  }

  function createTieredSeating() {
    var tierHeights = [5, 10, 15];
    var tierRadii = [50, 55, 60];

    for (var t = 0; t < tierHeights.length; t++) {
      var tierGeometry = new THREE.BoxGeometry(90, 3, 5);
      var tierMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });

      var segments = 16;
      for (var i = 0; i < segments; i++) {
        var angle = (i / segments) * Math.PI * 2;
        var x = Math.cos(angle) * tierRadii[t];
        var z = Math.sin(angle) * tierRadii[t];

        var tier = new THREE.Mesh(tierGeometry, tierMaterial);
        tier.position.set(x, tierHeights[t], z);
        tier.rotation.y = angle;
        tier.scale.set(0.3, 1, 1);
        scene.add(tier);

        for (var c = 0; c < 3; c++) {
          var crowdGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
          var crowdMaterial = new THREE.MeshPhongMaterial({ color: 0xcc6600 + Math.random() * 0x110000 });
          var crowdBox = new THREE.Mesh(crowdGeometry, crowdMaterial);
          crowdBox.position.set(x + (c - 1) * 1.5, tierHeights[t] + 2, z);
          crowdBox.baseY = crowdBox.position.y;
          crowdBox.bobOffset = Math.random() * Math.PI * 2;
          scene.add(crowdBox);
          crowdBoxes.push(crowdBox);
        }
      }
    }
  }

  function createArenaGates() {
    var gatePositions = [
      { x: 0, z: -42, angle: 0 },
      { x: 0, z: 42, angle: Math.PI },
      { x: -42, z: 0, angle: Math.PI / 2 },
      { x: 42, z: 0, angle: -Math.PI / 2 }
    ];

    gatePositions.forEach(function(pos) {
      createGateArchway(pos.x, pos.z, pos.angle);
    });
  }

  function createGateArchway(x, z, angle) {
    var frameGeometry = new THREE.BoxGeometry(8, 12, 1);
    var frameMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var frameL = new THREE.Mesh(frameGeometry, frameMaterial);
    frameL.position.set(x - 5, 6, z);
    frameL.rotation.y = angle;
    scene.add(frameL);

    var frameR = new THREE.Mesh(frameGeometry, frameMaterial);
    frameR.position.set(x + 5, 6, z);
    frameR.rotation.y = angle;
    scene.add(frameR);

    for (var b = 0; b < 8; b++) {
      var barGeometry = new THREE.BoxGeometry(0.3, 10, 0.3);
      var barMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var bar = new THREE.Mesh(barGeometry, barMaterial);
      bar.position.set(x + (b - 3.5) * 1.2, 6, z + 0.5);
      bar.rotation.y = angle;
      scene.add(bar);
    }

    var cellGeometry = new THREE.BoxGeometry(6, 8, 4);
    var cellMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var cell = new THREE.Mesh(cellGeometry, cellMaterial);
    cell.position.set(x, 4, z - 10);
    scene.add(cell);
  }

  function createEmperorBox() {
    var boxGeometry = new THREE.BoxGeometry(12, 8, 8);
    var boxMaterial = new THREE.MeshPhongMaterial({ color: 0xaa8844 });
    var box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0, 18, -50);
    scene.add(box);

    var canopyGeometry = new THREE.BoxGeometry(14, 1, 10);
    var canopyMaterial = new THREE.MeshPhongMaterial({ color: 0xdd0000 });
    var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(0, 26, -50);
    scene.add(canopy);

    var throneGeometry = new THREE.BoxGeometry(4, 5, 4);
    var throneMaterial = new THREE.MeshPhongMaterial({ color: 0xffdd00 });
    var throne = new THREE.Mesh(throneGeometry, throneMaterial);
    throne.position.set(0, 18, -46);
    scene.add(throne);

    for (var g = 0; g < 2; g++) {
      var guardGeometry = new THREE.BoxGeometry(1.5, 3, 1.5);
      var guardMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
      var guard = new THREE.Mesh(guardGeometry, guardMaterial);
      guard.position.set(-3 + g * 6, 18, -48);
      scene.add(guard);
    }
  }

  function createGladiatorFighters() {
    for (var i = 0; i < 5; i++) {
      var angle = (i / 5) * Math.PI * 2;
      var x = Math.cos(angle) * 20;
      var z = Math.sin(angle) * 20;

      var bodyGeometry = new THREE.BoxGeometry(1.5, 2.5, 1);
      var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xb8860b });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(x, 1.5, z);
      scene.add(body);

      var headGeometry = new THREE.BoxGeometry(1, 1, 1);
      var headMaterial = new THREE.MeshPhongMaterial({ color: 0xddaa88 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(x, 3.5, z);
      scene.add(head);

      var armGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
      var armMaterial = new THREE.MeshPhongMaterial({ color: 0xb8860b });
      var arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(x + 1.5, 2, z);
      scene.add(arm);

      var weaponGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.3);
      var weaponMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
      var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
      weapon.position.set(x + 2, 1, z);
      scene.add(weapon);

      fighters.push({ body: body, angle: angle });
    }
  }

  function createArmedSoldiers() {
    for (var i = 0; i < 4; i++) {
      var x = -30 + i * 20;
      var z = -15 + (i % 2) * 10;

      var bodyGeometry = new THREE.BoxGeometry(1.2, 2.2, 0.8);
      var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x228844 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(x, 1.2, z);
      scene.add(body);

      var headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      var headMaterial = new THREE.MeshPhongMaterial({ color: 0xddaa88 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(x, 3, z);
      scene.add(head);

      var rifleGeometry = new THREE.BoxGeometry(0.2, 0.3, 2);
      var rifleMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
      var rifle = new THREE.Mesh(rifleGeometry, rifleMaterial);
      rifle.position.set(x + 0.8, 2.5, z);
      scene.add(rifle);

      enemies.push({ body: body });
    }
  }

  function createCrossbowmen() {
    var positions = [
      { x: -30, z: 55, angle: -Math.PI / 4 },
      { x: 0, z: 60, angle: -Math.PI / 2 },
      { x: 30, z: 55, angle: -3 * Math.PI / 4 },
      { x: 50, z: 30, angle: Math.PI },
      { x: 50, z: -30, angle: Math.PI },
      { x: 30, z: -55, angle: Math.PI + Math.PI / 4 }
    ];

    positions.forEach(function(pos) {
      var bodyGeometry = new THREE.BoxGeometry(1, 2, 0.8);
      var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, 18, pos.z);
      scene.add(body);

      var bowGeometry = new THREE.BoxGeometry(0.2, 1.5, 2);
      var bowMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
      var bow = new THREE.Mesh(bowGeometry, bowMaterial);
      bow.position.set(pos.x + 0.5, 18, pos.z);
      scene.add(bow);
    });
  }

  function createCentralObelisk() {
    var obeliskGeometry = new THREE.BoxGeometry(2, 20, 2);
    var obeliskMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    var obelisk = new THREE.Mesh(obeliskGeometry, obeliskMaterial);
    obelisk.position.set(0, 10, 0);
    scene.add(obelisk);
  }

  function createCatapults() {
    var positions = [
      { x: -35, z: 35 },
      { x: 35, z: 35 }
    ];

    positions.forEach(function(pos) {
      var baseGeometry = new THREE.BoxGeometry(6, 1, 6);
      var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(pos.x, 0.5, pos.z);
      scene.add(base);

      var frameGeometry = new THREE.BoxGeometry(4, 3, 4);
      var frameMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(pos.x, 2.5, pos.z);
      scene.add(frame);

      var armGeometry = new THREE.BoxGeometry(0.4, 0.4, 8);
      var armMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
      var arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(pos.x, 4, pos.z);
      arm.baseRotation = 0;
      scene.add(arm);

      var bucketGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
      var bucketMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
      var bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
      bucket.position.set(pos.x, 8, pos.z - 3);
      scene.add(bucket);

      var counterGeometry = new THREE.BoxGeometry(1, 1, 1);
      var counterMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
      var counter = new THREE.Mesh(counterGeometry, counterMaterial);
      counter.position.set(pos.x, 5.5, pos.z + 3);
      scene.add(counter);

      catapults.push({ arm: arm });
    });
  }

  function createSandPatches() {
    var patchPositions = [
      { x: -20, z: -15 },
      { x: 20, z: 10 },
      { x: -10, z: 25 },
      { x: 25, z: -20 },
      { x: 0, z: 0 },
      { x: -30, z: 0 }
    ];

    patchPositions.forEach(function(pos) {
      var patchGeometry = new THREE.BoxGeometry(8, 0.05, 8);
      var patchMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
      var patch = new THREE.Mesh(patchGeometry, patchMaterial);
      patch.position.set(pos.x, 0.2, pos.z);
      scene.add(patch);
    });
  }

  function createTrapDoors() {
    var doorPositions = [
      { x: -15, z: -10 },
      { x: 15, z: -10 },
      { x: -15, z: 10 },
      { x: 15, z: 10 }
    ];

    doorPositions.forEach(function(pos) {
      var doorGeometry = new THREE.BoxGeometry(4, 0.3, 4);
      var doorMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      var door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(pos.x, 0.15, pos.z);
      door.baseY = door.position.y;
      door.liftProgress = 0;
      scene.add(door);
      trapDoors.push(door);
    });
  }

  function createTorchRings() {
    var segments = 24;
    var radius = 43;

    for (var i = 0; i < segments; i++) {
      var angle = (i / segments) * Math.PI * 2;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var torchGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      var torchMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0xff6600 });
      var torch = new THREE.Mesh(torchGeometry, torchMaterial);
      torch.position.set(x, 20, z);
      torch.flickerPhase = Math.random() * Math.PI * 2;
      scene.add(torch);
    }
  }

  function createVictoryBanner() {
    var poleGeometry = new THREE.BoxGeometry(0.4, 15, 0.4);
    var poleMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(-40, 7.5, 40);
    scene.add(pole);

    var flagGeometry = new THREE.BoxGeometry(6, 4, 0.1);
    var flagMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(-37, 13, 40);
    scene.add(flag);
  }

  function createShieldedColumns() {
    var positions = [
      { x: -15, z: 0 },
      { x: 15, z: 0 },
      { x: 0, z: -15 },
      { x: 0, z: 15 }
    ];

    positions.forEach(function(pos) {
      var colGeometry = new THREE.BoxGeometry(2, 6, 2);
      var colMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
      var col = new THREE.Mesh(colGeometry, colMaterial);
      col.position.set(pos.x, 3, pos.z);
      scene.add(col);
    });
  }

  function createHUD() {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('GLADIATORS: ' + state.gladiatorCount, 10, 20);
    ctx.fillText('ENEMIES: ' + state.enemyCount, 10, 40);
    ctx.fillText('CROWD FAVOR: ' + state.crowdFavor + '%', 10, 60);

    var texture = new THREE.CanvasTexture(canvas);
    var hudGeometry = new THREE.BoxGeometry(8, 2, 0.1);
    var hudMaterial = new THREE.MeshPhongMaterial({ map: texture });
    var hudMesh = new THREE.Mesh(hudGeometry, hudMaterial);
    hudMesh.position.set(-35, 18, 10);

    return hudMesh;
  }

  function updateHUD(hudMesh) {
    hudMesh.material.map.source.data.width = 256;
    var canvas = hudMesh.material.map.source.data;
    if (canvas.getContext) {
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('GLADIATORS: ' + state.gladiatorCount, 10, 20);
      ctx.fillText('ENEMIES: ' + state.enemyCount, 10, 40);
      ctx.fillText('CROWD FAVOR: ' + state.crowdFavor + '%', 10, 60);

      hudMesh.material.map.needsUpdate = true;
    }
  }

  function handleKeyDown(event) {
    if (event.code === 'KeyH') {
      state.hPressed = true;
      state.hPressTime = time;
    }
    if (event.code === 'KeyO' && state.hPressed && (time - state.hPressTime) < 0.4) {
      state.hudVisible = !state.hudVisible;
      state.hPressed = false;
    }
  }

  function handleKeyUp(event) {
    if (event.code === 'KeyH') {
      state.hPressed = false;
    }
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    createArenaFloor();
    createColiseumWall();
    createTieredSeating();
    createArenaGates();
    createEmperorBox();
    createGladiatorFighters();
    createArmedSoldiers();
    createCrossbowmen();
    createCentralObelisk();
    createCatapults();
    createSandPatches();
    createTrapDoors();
    createTorchRings();
    createVictoryBanner();
    createShieldedColumns();

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  }

  function update(delta) {
    time += delta;

    fighters.forEach(function(fighter) {
      fighter.angle += delta * 0.3;
      fighter.body.position.x = Math.cos(fighter.angle) * 20;
      fighter.body.position.z = Math.sin(fighter.angle) * 20;
    });

    crowdBoxes.forEach(function(box) {
      box.position.y = box.baseY + Math.sin(time + box.bobOffset) * 0.2;
    });

    catapults.forEach(function(catapult) {
      catapult.arm.rotation.z = Math.sin(time * 0.8) * 0.4;
    });

    trapDoors.forEach(function(door) {
      door.liftProgress = (Math.sin(time * 0.6) + 1) / 2;
      door.position.y = door.baseY + door.liftProgress * 3;
    });

    var allMeshes = scene.children;
    for (var i = 0; i < allMeshes.length; i++) {
      var mesh = allMeshes[i];
      if (mesh.flickerPhase !== undefined) {
        mesh.material.emissiveIntensity = 0.5 + Math.sin(time * 3 + mesh.flickerPhase) * 0.4;
      }
    }
  }

  function reset() {
    scene.clear();
    fighters = [];
    enemies = [];
    crowdBoxes = [];
    trapDoors = [];
    catapults = [];
    time = 0;
    state.gladiatorCount = 5;
    state.enemyCount = 4;
    state.crowdFavor = 50;
    state.hPressed = false;
    state.oPressed = false;
    state.hudVisible = false;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
