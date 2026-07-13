window.PirateFortress = (function() {
  'use strict';

  var fortressObjects = [];
  var animatingObjects = [];
  var scene = null;
  var camera = null;
  var cannonSmoke = [];
  var torchLights = [];
  var spawnPoints = [];

  function createCliffFace() {
    var cliffGeometry = new THREE.BoxGeometry(80, 60, 20);
    var cliffMaterial = new THREE.MeshPhongMaterial({ color: 0x8A8A7A, shininess: 20 });
    var cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
    cliff.position.set(0, -10, -40);
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    scene.add(cliff);
    fortressObjects.push(cliff);

    // Add rocky texture details with small protrusions
    for (var i = 0; i < 8; i++) {
      var rockGeometry = new THREE.BoxGeometry(
        Math.random() * 15 + 8,
        Math.random() * 12 + 6,
        3
      );
      var rockMaterial = new THREE.MeshPhongMaterial({ color: 0x7A7A6A });
      var rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        Math.random() * 60 - 30,
        Math.random() * 40 - 20,
        -38 + Math.random() * 4
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      fortressObjects.push(rock);
    }
  }

  function createOuterWall() {
    // Main outer wall with battlements
    var wallGeometry = new THREE.BoxGeometry(70, 25, 2);
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x8A8A7A });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 15, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    fortressObjects.push(wall);

    // Battlements (crenellations)
    for (var i = 0; i < 12; i++) {
      var battleGeometry = new THREE.BoxGeometry(4, 8, 2);
      var battleMaterial = new THREE.MeshPhongMaterial({ color: 0x8A8A7A });
      var battlement = new THREE.Mesh(battleGeometry, battleMaterial);
      battlement.position.set(
        -30 + i * 6,
        25,
        0
      );
      battlement.castShadow = true;
      battlement.receiveShadow = true;
      scene.add(battlement);
      fortressObjects.push(battlement);
    }

    // Gate entrance
    var gateGeometry = new THREE.BoxGeometry(12, 15, 2);
    var gateMaterial = new THREE.MeshPhongMaterial({ color: 0x5A5A4A });
    var gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(-25, 10, 2);
    gate.castShadow = true;
    gate.receiveShadow = true;
    scene.add(gate);
    fortressObjects.push(gate);
    spawnPoints.push({ name: 'fortress_gate', position: new THREE.Vector3(-25, 12, 10) });
  }

  function createCannonBattery() {
    var cannonPositions = [
      { x: -20, y: 18, z: 5 },
      { x: -5, y: 18, z: 5 },
      { x: 10, y: 18, z: 5 },
      { x: 25, y: 18, z: 5 }
    ];

    cannonPositions.forEach(function(pos) {
      // Cannon carriage
      var carriageGeometry = new THREE.BoxGeometry(3, 2, 2.5);
      var carriageMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
      var carriage = new THREE.Mesh(carriageGeometry, carriageMaterial);
      carriage.position.set(pos.x, pos.y, pos.z);
      carriage.castShadow = true;
      carriage.receiveShadow = true;
      scene.add(carriage);
      fortressObjects.push(carriage);

      // Cannon barrel
      var barrelGeometry = new THREE.CylinderGeometry(0.4, 0.45, 4, 16);
      var barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x1A1A1A });
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set(pos.x, pos.y + 0.8, pos.z);
      barrel.rotation.z = Math.PI / 6;
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      scene.add(barrel);
      fortressObjects.push(barrel);

      // Cannonball stack
      var ballGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var ballMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      for (var i = 0; i < 3; i++) {
        var ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.position.set(pos.x + 3, pos.y - 0.5 - i * 0.7, pos.z);
        ball.castShadow = true;
        ball.receiveShadow = true;
        scene.add(ball);
        fortressObjects.push(ball);
      }
    });

    spawnPoints.push({ name: 'cannon_battery', position: new THREE.Vector3(0, 20, 8) });
  }

  function createPowderMagazine() {
    var magGeometry = new THREE.BoxGeometry(15, 12, 10);
    var magMaterial = new THREE.MeshPhongMaterial({ color: 0x6A6A5A });
    var magazine = new THREE.Mesh(magGeometry, magMaterial);
    magazine.position.set(35, 5, 5);
    magazine.castShadow = true;
    magazine.receiveShadow = true;
    scene.add(magazine);
    fortressObjects.push(magazine);

    // Warning barrel on top
    var barrelGeometry = new THREE.CylinderGeometry(1.2, 1.3, 1.8, 8);
    var barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000 });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(35, 12, 5);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    scene.add(barrel);
    fortressObjects.push(barrel);
  }

  function createCrowsNest() {
    var poleGeometry = new THREE.CylinderGeometry(0.5, 0.6, 35, 16);
    var poleMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(-35, 8, 10);
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);
    fortressObjects.push(pole);

    // Crow's nest platform
    var nestGeometry = new THREE.CylinderGeometry(3, 3, 1, 32);
    var nestMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var nest = new THREE.Mesh(nestGeometry, nestMaterial);
    nest.position.set(-35, 28, 10);
    nest.castShadow = true;
    nest.receiveShadow = true;
    scene.add(nest);
    fortressObjects.push(nest);
    animatingObjects.push({ object: nest, type: 'rotate', speed: 0.5, axis: 'y' });

    spawnPoints.push({ name: 'crows_nest', position: new THREE.Vector3(-35, 30, 10) });
  }

  function createSkullFlagPole() {
    var flagPoleGeometry = new THREE.CylinderGeometry(0.3, 0.35, 18, 8);
    var flagPoleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    flagPole.position.set(40, 20, 0);
    flagPole.castShadow = true;
    flagPole.receiveShadow = true;
    scene.add(flagPole);
    fortressObjects.push(flagPole);

    // Flag
    var flagGeometry = new THREE.BoxGeometry(6, 4, 0.1);
    var flagMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    var flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(43, 24, 0);
    flag.castShadow = true;
    flag.receiveShadow = true;
    scene.add(flag);
    fortressObjects.push(flag);
    animatingObjects.push({ object: flag, type: 'wave', speed: 1.5, axis: 'x', amplitude: 0.3 });

    // Skull on flag (sphere geometry for simplicity)
    var skullGeometry = new THREE.SphereGeometry(1, 16, 16);
    var skullMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    var skull = new THREE.Mesh(skullGeometry, skullMaterial);
    skull.position.set(43, 24, 0.1);
    skull.castShadow = true;
    skull.receiveShadow = true;
    scene.add(skull);
    fortressObjects.push(skull);
  }

  function createDungeonEntrance() {
    // Dungeon door frame
    var doorFrameGeometry = new THREE.BoxGeometry(8, 12, 0.5);
    var doorFrameMaterial = new THREE.MeshPhongMaterial({ color: 0x4A4A3A });
    var doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
    doorFrame.position.set(-45, 5, 15);
    doorFrame.castShadow = true;
    doorFrame.receiveShadow = true;
    scene.add(doorFrame);
    fortressObjects.push(doorFrame);

    // Cell bars (vertical)
    for (var i = 0; i < 5; i++) {
      var barGeometry = new THREE.BoxGeometry(0.3, 10, 0.2);
      var barMaterial = new THREE.MeshPhongMaterial({ color: 0x2A2A2A });
      var bar = new THREE.Mesh(barGeometry, barMaterial);
      bar.position.set(-44 + i * 2, 5, 15);
      bar.castShadow = true;
      bar.receiveShadow = true;
      scene.add(bar);
      fortressObjects.push(bar);
      animatingObjects.push({ object: bar, type: 'rattle', speed: 0.3, axis: 'x', amplitude: 0.05 });
    }

    // Horizontal bars
    for (var j = 0; j < 3; j++) {
      var hbarGeometry = new THREE.BoxGeometry(8, 0.3, 0.2);
      var hbarMaterial = new THREE.MeshPhongMaterial({ color: 0x2A2A2A });
      var hbar = new THREE.Mesh(hbarGeometry, hbarMaterial);
      hbar.position.set(-45, 2 + j * 4, 15);
      hbar.castShadow = true;
      hbar.receiveShadow = true;
      scene.add(hbar);
      fortressObjects.push(hbar);
    }

    spawnPoints.push({ name: 'dungeon', position: new THREE.Vector3(-45, 8, 22) });
  }

  function createTreasureRoom() {
    // Treasure vault room
    var vaultGeometry = new THREE.BoxGeometry(20, 10, 15);
    var vaultMaterial = new THREE.MeshPhongMaterial({ color: 0x5A5A4A });
    var vault = new THREE.Mesh(vaultGeometry, vaultMaterial);
    vault.position.set(30, 5, -20);
    vault.castShadow = true;
    vault.receiveShadow = true;
    scene.add(vault);
    fortressObjects.push(vault);

    // Treasure chests
    for (var i = 0; i < 4; i++) {
      var chestGeometry = new THREE.BoxGeometry(3, 2.5, 2);
      var chestMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
      var chest = new THREE.Mesh(chestGeometry, chestMaterial);
      chest.position.set(20 + i * 3, 6, -20);
      chest.castShadow = true;
      chest.receiveShadow = true;
      scene.add(chest);
      fortressObjects.push(chest);

      // Gold coins stacked in chest
      for (var j = 0; j < 3; j++) {
        var coinGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
        var coinMaterial = new THREE.MeshPhongMaterial({ color: 0xD4AF37 });
        var coin = new THREE.Mesh(coinGeometry, coinMaterial);
        coin.position.set(20 + i * 3, 7 + j * 0.15, -20);
        coin.rotation.x = Math.random() * Math.PI;
        coin.castShadow = true;
        coin.receiveShadow = true;
        scene.add(coin);
        fortressObjects.push(coin);
      }
    }

    spawnPoints.push({ name: 'treasure_room', position: new THREE.Vector3(30, 8, -10) });
  }

  function createHarborView() {
    // Sea water (using BoxGeometry with small depth)
    var seaGeometry = new THREE.BoxGeometry(150, 2, 100);
    var seaMaterial = new THREE.MeshPhongMaterial({ color: 0x1A4A8A });
    var sea = new THREE.Mesh(seaGeometry, seaMaterial);
    sea.position.set(0, -25, -30);
    sea.receiveShadow = true;
    scene.add(sea);
    fortressObjects.push(sea);

    // Ship mast
    var mastGeometry = new THREE.CylinderGeometry(0.4, 0.5, 25, 8);
    var mastMaterial = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(60, -10, -50);
    mast.castShadow = true;
    mast.receiveShadow = true;
    scene.add(mast);
    fortressObjects.push(mast);
    animatingObjects.push({ object: mast, type: 'rock', speed: 0.8, axis: 'z', amplitude: 2 });

    // Ship hull
    var hullGeometry = new THREE.BoxGeometry(12, 6, 20);
    var hullMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(60, -16, -50);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);
    fortressObjects.push(hull);
    animatingObjects.push({ object: hull, type: 'rock', speed: 0.8, axis: 'z', amplitude: 1.5 });
  }

  function createRopeLadder() {
    var ropePositions = [];
    for (var i = 0; i < 15; i++) {
      ropePositions.push(new THREE.Vector3(45, 35 - i * 2.5, 5));
      ropePositions.push(new THREE.Vector3(48, 35 - i * 2.5, 5));
    }

    var ropeGeometry = new THREE.BufferGeometry();
    ropeGeometry.setFromPoints(ropePositions);
    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8B7355, linewidth: 2 });
    var rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
    scene.add(rope);
    fortressObjects.push(rope);

    // Rope rungs
    for (var j = 0; j < 14; j++) {
      var rungGeometry = new THREE.BoxGeometry(3.5, 0.3, 0.2);
      var rungMaterial = new THREE.MeshPhongMaterial({ color: 0xA0826D });
      var rung = new THREE.Mesh(rungGeometry, rungMaterial);
      rung.position.set(46.5, 35 - j * 2.5, 5);
      rung.castShadow = true;
      rung.receiveShadow = true;
      scene.add(rung);
      fortressObjects.push(rung);
    }
  }

  function createSecretTunnelEntrance() {
    // Hidden tunnel mouth in cliff
    var tunnelGeometry = new THREE.CylinderGeometry(4, 4.5, 1, 32);
    var tunnelMaterial = new THREE.MeshPhongMaterial({ color: 0x3A3A2A });
    var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel.position.set(-50, 0, -35);
    tunnel.rotation.z = Math.PI / 6;
    tunnel.castShadow = true;
    tunnel.receiveShadow = true;
    scene.add(tunnel);
    fortressObjects.push(tunnel);

    // Tunnel passage (BoxGeometry)
    var passageGeometry = new THREE.BoxGeometry(8, 8, 25);
    var passageMaterial = new THREE.MeshPhongMaterial({ color: 0x4A4A3A });
    var passage = new THREE.Mesh(passageGeometry, passageMaterial);
    passage.position.set(-60, -2, -50);
    passage.castShadow = true;
    passage.receiveShadow = true;
    scene.add(passage);
    fortressObjects.push(passage);
  }

  function createTorches() {
    var torchPositions = [
      { x: -40, y: 18, z: 5 },
      { x: -15, y: 18, z: 5 },
      { x: 15, y: 18, z: 5 },
      { x: 40, y: 18, z: 5 }
    ];

    torchPositions.forEach(function(pos) {
      // Torch stand
      var standGeometry = new THREE.BoxGeometry(0.8, 3, 0.8);
      var standMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var stand = new THREE.Mesh(standGeometry, standMaterial);
      stand.position.set(pos.x, pos.y, pos.z);
      stand.castShadow = true;
      stand.receiveShadow = true;
      scene.add(stand);
      fortressObjects.push(stand);

      // Torch flame (point light)
      var torchLight = new THREE.PointLight(0xFF6600, 1.5, 30);
      torchLight.position.set(pos.x, pos.y + 2, pos.z);
      torchLight.castShadow = true;
      scene.add(torchLight);
      torchLights.push({ light: torchLight, baseIntensity: 1.5, speed: 0.05 });
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    fortressObjects = [];
    animatingObjects = [];
    cannonSmoke = [];
    torchLights = [];
    spawnPoints = [];

    createCliffFace();
    createOuterWall();
    createCannonBattery();
    createPowderMagazine();
    createCrowsNest();
    createSkullFlagPole();
    createDungeonEntrance();
    createTreasureRoom();
    createHarborView();
    createRopeLadder();
    createSecretTunnelEntrance();
    createTorches();

    return {
      objects: fortressObjects,
      spawnPoints: spawnPoints,
      torchLights: torchLights
    };
  }

  function update(delta) {
    // Update animating objects
    animatingObjects.forEach(function(anim) {
      var time = Date.now() * 0.001;

      if (anim.type === 'rotate') {
        anim.object.rotation.y += anim.speed * delta;
      } else if (anim.type === 'wave') {
        var waveAmount = Math.sin(time * anim.speed) * anim.amplitude;
        if (anim.axis === 'x') {
          anim.object.rotation.x = waveAmount;
        }
      } else if (anim.type === 'rattle') {
        var rattleAmount = Math.sin(time * anim.speed * 5) * anim.amplitude;
        if (anim.axis === 'x') {
          anim.object.position.x += rattleAmount;
        }
      } else if (anim.type === 'rock') {
        var rockAmount = Math.sin(time * anim.speed * 0.5) * anim.amplitude;
        if (anim.axis === 'z') {
          anim.object.position.z += rockAmount;
        }
      }
    });

    // Update torch lights with flicker
    torchLights.forEach(function(torch) {
      var flicker = Math.sin(Date.now() * 0.003) * 0.3 + 1;
      torch.light.intensity = torch.baseIntensity * flicker;
    });

    // Update cannon smoke puffs
    for (var i = cannonSmoke.length - 1; i >= 0; i--) {
      var smoke = cannonSmoke[i];
      smoke.lifespan -= delta;
      smoke.object.position.y += delta * 2;
      smoke.object.scale.x += delta * 0.5;
      smoke.object.scale.y += delta * 0.5;
      smoke.object.scale.z += delta * 0.5;
      smoke.object.material.opacity = Math.max(0, smoke.lifespan / 2);

      if (smoke.lifespan <= 0) {
        scene.remove(smoke.object);
        cannonSmoke.splice(i, 1);
      }
    }
  }

  function fireCannonAt(position) {
    var smokeGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    var smokeMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.7
    });
    var smokePuff = new THREE.Mesh(smokeGeometry, smokeMaterial);
    smokePuff.position.copy(position);
    scene.add(smokePuff);
    cannonSmoke.push({
      object: smokePuff,
      lifespan: 2
    });
  }

  function reset() {
    fortressObjects.forEach(function(obj) {
      scene.remove(obj);
    });
    torchLights.forEach(function(torch) {
      scene.remove(torch.light);
    });
    cannonSmoke.forEach(function(smoke) {
      scene.remove(smoke.object);
    });

    fortressObjects = [];
    animatingObjects = [];
    cannonSmoke = [];
    torchLights = [];
    spawnPoints = [];
  }

  return {
    init: init,
    update: update,
    reset: reset,
    fireCannonAt: fireCannonAt,
    getSpawnPoints: function() { return spawnPoints; }
  };
}());
