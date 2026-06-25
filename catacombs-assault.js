window.CatacombsAssault = (function() {
  'use strict';

  var scene, camera;
  var floorMesh, wallLeftMesh, wallRightMesh;
  var skullWallMeshes = [];
  var torchBracketMeshes = [], torchFlameMeshes = [];
  var waterDropMeshes = [];
  var ossuary, weaponsCache;
  var bombMaker;
  var terroristCultMembers = [];
  var raidTeamOperators = [];
  var manhole;
  var ritualAltar, ritualCandleMeshes = [];
  var bombComponentMeshes = [];
  var mapTable, mapPaperMeshes = [], connectionStringMeshes = [];
  var waterPool;
  var glowStickMeshes = [];

  var hudElement;
  var bombsFound = 0;
  var terroristCount = 4;
  var tunnelDepth = -18;

  var waterDropVelocities = [];
  var torchFlameRotations = [];
  var bombMakerArmRotation = 0;
  var waterPoolPulse = 0;
  var lastHKeyTime = 0;
  var lastUKeyTime = 0;
  var hudVisible = false;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    createFloor();
    createTunnelWalls();
    createSkullWallDecoration();
    createTorchSconces();
    createDrippingWater();
    createOssuaryAlcove();
    createTerroristBombMaker();
    createWeaponsCacheRoom();
    createTerroristCultMembers();
    createRAIDTeamOperators();
    createManhole();
    createRitualAltar();
    createBombComponents();
    createMapTable();
    createWaterPool();
    createGlowSticks();
    createHUD();
    setupKeyboardInput();
  }

  function createFloor() {
    var geometry = new THREE.BoxGeometry(400, 0.3, 80);
    var material = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    floorMesh = new THREE.Mesh(geometry, material);
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
  }

  function createTunnelWalls() {
    var wallHeight = 12;
    var wallLength = 80;
    var wallThickness = 1;

    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    var leftWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    wallLeftMesh = new THREE.Mesh(leftWallGeo, wallMaterial);
    wallLeftMesh.position.x = -200;
    wallLeftMesh.position.y = wallHeight / 2;
    wallLeftMesh.castShadow = true;
    wallLeftMesh.receiveShadow = true;
    scene.add(wallLeftMesh);

    var rightWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    wallRightMesh = new THREE.Mesh(rightWallGeo, wallMaterial);
    wallRightMesh.position.x = 200;
    wallRightMesh.position.y = wallHeight / 2;
    wallRightMesh.castShadow = true;
    wallRightMesh.receiveShadow = true;
    scene.add(wallRightMesh);
  }

  function createSkullWallDecoration() {
    var skullColor = 0xf5f5dc;
    var startX = -180;
    var startZ = -30;
    var spacing = 12;
    var rows = 5;
    var cols = 3;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var skullGeo = new THREE.BoxGeometry(2, 2, 2);
        var skullMat = new THREE.MeshStandardMaterial({ color: skullColor });
        var skull = new THREE.Mesh(skullGeo, skullMat);
        skull.position.x = startX + c * spacing;
        skull.position.y = 4 + r * spacing;
        skull.position.z = -38;
        skull.castShadow = true;
        scene.add(skull);
        skullWallMeshes.push(skull);
      }
    }
  }

  function createTorchSconces() {
    var torchPositions = [
      { x: -150, z: -20 },
      { x: -150, z: 20 },
      { x: 150, z: -20 },
      { x: 150, z: 20 }
    ];

    for (var i = 0; i < torchPositions.length; i++) {
      var pos = torchPositions[i];

      var bracketGeo = new THREE.BoxGeometry(0.8, 3, 0.5);
      var bracketMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.6 });
      var bracket = new THREE.Mesh(bracketGeo, bracketMat);
      bracket.position.set(pos.x, 6, pos.z);
      bracket.castShadow = true;
      scene.add(bracket);
      torchBracketMeshes.push(bracket);

      var flameGeo = new THREE.SphereGeometry(0.4, 8, 8);
      var flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
      var flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(pos.x, 7.5, pos.z);
      scene.add(flame);
      torchFlameMeshes.push(flame);
      torchFlameRotations.push(Math.random() * Math.PI);
    }
  }

  function createDrippingWater() {
    var waterDropCount = 8;
    var dropPositions = [
      { x: -100, z: -10 },
      { x: -50, z: 5 },
      { x: 0, z: -15 },
      { x: 50, z: 10 },
      { x: 100, z: -8 },
      { x: -120, z: 25 },
      { x: 80, z: -20 },
      { x: -30, z: 15 }
    ];

    for (var i = 0; i < waterDropCount; i++) {
      var pos = dropPositions[i];
      var dropGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
      var dropMat = new THREE.MeshBasicMaterial({ color: 0x6699ff });
      var drop = new THREE.Mesh(dropGeo, dropMat);
      drop.position.set(pos.x, 11 + Math.random() * 2, pos.z);
      scene.add(drop);
      waterDropMeshes.push(drop);
      waterDropVelocities.push({
        x: 0,
        y: -(2 + Math.random()),
        z: 0,
        resetY: drop.position.y
      });
    }
  }

  function createOssuaryAlcove() {
    var alcoveGeo = new THREE.BoxGeometry(8, 6, 5);
    var alcoveMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    ossuary = new THREE.Mesh(alcoveGeo, alcoveMat);
    ossuary.position.set(-190, 3, 15);
    ossuary.castShadow = true;
    scene.add(ossuary);

    for (var i = 0; i < 4; i++) {
      var boneStackGeo = new THREE.BoxGeometry(0.6, 0.4, 3);
      var boneMat = new THREE.MeshStandardMaterial({ color: 0xd9d4b8 });
      var boneStack = new THREE.Mesh(boneStackGeo, boneMat);
      boneStack.position.set(-190 + (i - 1.5) * 1.5, 1 + i * 0.8, 15);
      scene.add(boneStack);
    }
  }

  function createTerroristBombMaker() {
    var torsoGeo = new THREE.BoxGeometry(1.5, 2, 1);
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    var torso = new THREE.Mesh(torsoGeo, darkMat);
    torso.position.set(0, 1.5, 30);
    torso.castShadow = true;
    scene.add(torso);

    var headGeo = new THREE.BoxGeometry(0.8, 1, 0.8);
    var head = new THREE.Mesh(headGeo, darkMat);
    head.position.set(0, 3.5, 30);
    head.castShadow = true;
    scene.add(head);

    var armGeo = new THREE.BoxGeometry(0.4, 1.8, 0.3);
    var arm = new THREE.Mesh(armGeo, darkMat);
    arm.position.set(1.2, 2, 30);
    arm.castShadow = true;
    scene.add(arm);

    bombMaker = {
      torso: torso,
      head: head,
      arm: arm,
      initialArmRotation: 0
    };
  }

  function createWeaponsCacheRoom() {
    var roomGeo = new THREE.BoxGeometry(12, 8, 6);
    var roomMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    weaponsCache = new THREE.Mesh(roomGeo, roomMat);
    weaponsCache.position.set(190, 4, -20);
    weaponsCache.castShadow = true;
    scene.add(weaponsCache);

    for (var i = 0; i < 3; i++) {
      var crateGeo = new THREE.BoxGeometry(3, 2.5, 2);
      var crateMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a });
      var crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(185 + i * 4, 1.5, -20);
      crate.castShadow = true;
      scene.add(crate);
    }
  }

  function createTerroristCultMembers() {
    var positions = [
      { x: -80, z: 0 },
      { x: -60, z: -10 },
      { x: 60, z: 5 },
      { x: 80, z: -8 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      var robeGeo = new THREE.BoxGeometry(1.2, 2.8, 0.8);
      var robeMat = new THREE.MeshStandardMaterial({ color: 0x1a0a0a });
      var robe = new THREE.Mesh(robeGeo, robeMat);
      robe.position.set(pos.x, 1.5, pos.z);
      robe.castShadow = true;
      scene.add(robe);

      var maskGeo = new THREE.BoxGeometry(0.7, 0.7, 0.5);
      var maskMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
      var mask = new THREE.Mesh(maskGeo, maskMat);
      mask.position.set(pos.x, 3.2, pos.z);
      mask.castShadow = true;
      scene.add(mask);

      terroristCultMembers.push({ robe: robe, mask: mask });
    }
  }

  function createRAIDTeamOperators() {
    var positions = [
      { x: -8, y: 20 },
      { x: 8, y: 19 },
      { x: -4, y: 18 },
      { x: 4, y: 17 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      var bodyGeo = new THREE.BoxGeometry(1, 2.5, 0.6);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(pos.x, pos.y, -35);
      body.castShadow = true;
      scene.add(body);

      var helmetGeo = new THREE.BoxGeometry(0.8, 0.8, 0.6);
      var helmetMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var helmet = new THREE.Mesh(helmetGeo, helmetMat);
      helmet.position.set(pos.x, pos.y + 1.8, -35);
      helmet.castShadow = true;
      scene.add(helmet);

      raidTeamOperators.push({
        body: body,
        helmet: helmet,
        targetY: 2 + i * 0.5,
        startY: pos.y
      });
    }
  }

  function createManhole() {
    var ceilingGapGeo = new THREE.BoxGeometry(5, 0.5, 4);
    var ceilingGapMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    var ceilingGap = new THREE.Mesh(ceilingGapGeo, ceilingGapMat);
    ceilingGap.position.set(0, 21, -35);
    scene.add(ceilingGap);

    for (var i = 0; i < 8; i++) {
      var ropeRungGeo = new THREE.BoxGeometry(4.5, 0.2, 0.2);
      var ropeMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
      var rung = new THREE.Mesh(ropeRungGeo, ropeMat);
      rung.position.set(0, 20.5 - i * 1.5, -35);
      scene.add(rung);
    }

    manhole = {
      position: { x: 0, y: 21, z: -35 }
    };
  }

  function createRitualAltar() {
    var altarGeo = new THREE.BoxGeometry(6, 0.5, 8);
    var altarMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, emissive: 0x2a1a1a });
    ritualAltar = new THREE.Mesh(altarGeo, altarMat);
    ritualAltar.position.set(0, 0.3, -50);
    scene.add(ritualAltar);

    for (var i = 0; i < 4; i++) {
      var candleGeo = new THREE.SphereGeometry(0.25, 8, 8);
      var candleMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
      var candle = new THREE.Mesh(candleGeo, candleMat);
      var angle = (i / 4) * Math.PI * 2;
      candle.position.set(
        Math.cos(angle) * 3,
        1,
        -50 + Math.sin(angle) * 3
      );
      scene.add(candle);
      ritualCandleMeshes.push(candle);
    }
  }

  function createBombComponents() {
    var componentPositions = [
      { x: 2, z: 28 },
      { x: -1, z: 28 },
      { x: 1, z: 26 }
    ];

    for (var i = 0; i < componentPositions.length; i++) {
      var pos = componentPositions[i];
      var componentGeo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
      var componentMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      var component = new THREE.Mesh(componentGeo, componentMat);
      component.position.set(pos.x, 0.8, pos.z);
      scene.add(component);
      bombComponentMeshes.push(component);
    }
  }

  function createMapTable() {
    var tableGeo = new THREE.BoxGeometry(5, 1, 4);
    var tableMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    mapTable = new THREE.Mesh(tableGeo, tableMat);
    mapTable.position.set(-180, 1, -25);
    mapTable.castShadow = true;
    scene.add(mapTable);

    for (var i = 0; i < 2; i++) {
      var paperGeo = new THREE.BoxGeometry(1.5, 0.05, 1.2);
      var paperMat = new THREE.MeshStandardMaterial({ color: 0xc9c9c9 });
      var paper = new THREE.Mesh(paperGeo, paperMat);
      paper.position.set(-182 + i * 2, 1.5, -25);
      scene.add(paper);
      mapPaperMeshes.push(paper);
    }

    for (var j = 0; j < 3; j++) {
      var stringGeo = new THREE.BoxGeometry(0.05, 0.1, 2);
      var stringMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      var string = new THREE.Mesh(stringGeo, stringMat);
      string.position.set(-183 + j * 1.5, 1.4, -25);
      scene.add(string);
      connectionStringMeshes.push(string);
    }
  }

  function createWaterPool() {
    var poolGeo = new THREE.BoxGeometry(20, 0.4, 10);
    var poolMat = new THREE.MeshBasicMaterial({ color: 0x1a3a5a });
    waterPool = new THREE.Mesh(poolGeo, poolMat);
    waterPool.position.set(120, 0.2, 40);
    scene.add(waterPool);
  }

  function createGlowSticks() {
    var glowPositions = [
      { x: -100, z: 35 },
      { x: 0, z: 50 },
      { x: 100, z: 42 }
    ];

    for (var i = 0; i < glowPositions.length; i++) {
      var pos = glowPositions[i];
      var glowGeo = new THREE.BoxGeometry(0.3, 2, 0.3);
      var glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      var glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(pos.x, 0.5, pos.z);
      scene.add(glow);
      glowStickMeshes.push(glow);
    }
  }

  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.style.position = 'absolute';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '16px';
    hudElement.style.lineHeight = '1.5';
    hudElement.style.display = 'none';
    hudElement.style.zIndex = '1000';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '1px solid #00ff00';
    document.body.appendChild(hudElement);
    updateHUD();
  }

  function updateHUD() {
    if (hudElement) {
      hudElement.innerHTML =
        'BOMBS FOUND: ' + bombsFound + '/3<br>' +
        'TERRORISTS: ' + terroristCount + '<br>' +
        'TUNNEL DEPTH: ' + tunnelDepth + 'm';
    }
  }

  function setupKeyboardInput() {
    document.addEventListener('keydown', function(event) {
      if (event.key.toLowerCase() === 'h') {
        var now = Date.now();
        if (now - lastHKeyTime < 400) {
          lastHKeyTime = 0;
          return;
        }
        lastHKeyTime = now;
      } else if (event.key.toLowerCase() === 'u') {
        var now = Date.now();
        if (now - lastUKeyTime < 400) {
          lastUKeyTime = 0;
          if (now - lastHKeyTime < 400) {
            hudVisible = !hudVisible;
            hudElement.style.display = hudVisible ? 'block' : 'none';
          }
          return;
        }
        lastUKeyTime = now;
      }
    });
  }

  function update(delta) {
    updateWaterDrops(delta);
    updateTorchFlames(delta);
    updateBombMaker(delta);
    updateRitualCandles(delta);
    updateTerrorists(delta);
    updateRAIDTeam(delta);
    updateWaterPoolPulse(delta);
  }

  function updateWaterDrops(delta) {
    for (var i = 0; i < waterDropMeshes.length; i++) {
      var drop = waterDropMeshes[i];
      var velocity = waterDropVelocities[i];

      drop.position.y += velocity.y * delta;

      if (drop.position.y < 0.5) {
        drop.position.y = velocity.resetY;
        velocity.y = -(2 + Math.random());
      }
    }
  }

  function updateTorchFlames(delta) {
    for (var i = 0; i < torchFlameMeshes.length; i++) {
      var flame = torchFlameMeshes[i];
      torchFlameRotations[i] += Math.sin(torchFlameRotations[i]) * delta;

      var flicker = Math.sin(torchFlameRotations[i] * 2) * 0.15;
      flame.scale.y = 1 + flicker;
      flame.position.y = 7.5 + flicker * 0.2;
    }
  }

  function updateBombMaker(delta) {
    if (bombMaker && bombMaker.arm) {
      bombMakerArmRotation += delta;
      var armAngle = Math.sin(bombMakerArmRotation * 1.5) * 0.6;
      bombMaker.arm.rotation.z = armAngle;
    }
  }

  function updateRitualCandles(delta) {
    for (var i = 0; i < ritualCandleMeshes.length; i++) {
      var candle = ritualCandleMeshes[i];
      var flicker = Math.sin(Date.now() * 0.005 + i) * 0.2;
      candle.scale.y = 1 + flicker;
      candle.position.y = 1 + flicker * 0.1;
    }
  }

  function updateTerrorists(delta) {
    for (var i = 0; i < terroristCultMembers.length; i++) {
      var terrorist = terroristCultMembers[i];
      if (terrorist.robe) {
        var sway = Math.sin(Date.now() * 0.002 + i) * 0.1;
        terrorist.robe.rotation.z = sway;
      }
    }
  }

  function updateRAIDTeam(delta) {
    for (var i = 0; i < raidTeamOperators.length; i++) {
      var operator = raidTeamOperators[i];
      var currentY = operator.body.position.y;
      var descend = Math.max(currentY - delta * 3, operator.targetY);
      operator.body.position.y = descend;
      operator.helmet.position.y = descend + 1.8;
    }
  }

  function updateWaterPoolPulse(delta) {
    waterPoolPulse += delta;
    if (waterPool) {
      var pulse = Math.sin(waterPoolPulse * 2) * 0.1;
      waterPool.material.color.setHex(parseInt('1a3a5a', 16) + Math.floor(pulse * 100000));
    }
  }

  function reset() {
    bombsFound = 0;
    terroristCount = 4;
    tunnelDepth = -18;
    updateHUD();

    bombMakerArmRotation = 0;
    waterPoolPulse = 0;

    for (var i = 0; i < raidTeamOperators.length; i++) {
      var operator = raidTeamOperators[i];
      operator.body.position.y = operator.startY;
      operator.helmet.position.y = operator.startY + 1.8;
    }

    for (var j = 0; j < waterDropMeshes.length; j++) {
      waterDropMeshes[j].position.y = waterDropVelocities[j].resetY;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
