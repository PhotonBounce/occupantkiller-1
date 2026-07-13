window.MedievalFortress = (function() {
  'use strict';

  var config = {
    stoneColor: 0x6b5d4f,
    darkStoneColor: 0x4a3f35,
    torchColor: 0xff8800,
    moatColor: 0x1a3a52,
    mistColor: 0xb8a892,
    mistDensity: 0.08
  };

  var state = {
    scene: null,
    camera: null,
    objects: [],
    enemies: [],
    torches: [],
    drawbridge: null,
    drawbridgeOpen: false,
    gameState: {
      gateBreached: false,
      extremistsDown: 0,
      totalEnemies: 12,
      weaponsCacheFound: false
    },
    keybind: {
      lastM: null,
      lastF: null,
      threshold: 400
    },
    hudEnabled: true,
    animations: {
      drawbridgeAngle: 0,
      drawbridgeSpeed: 1.5,
      torchFlicker: 0,
      flagWave: 0
    }
  };

  var HUDElement = null;

  function createWalls() {
    var wallGroup = new THREE.Group();
    var wallHeight = 15;
    var wallThickness = 1;
    var wallLength = 80;

    var stoneGeom = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
    var stoneMat = new THREE.MeshStandardMaterial({
      color: config.stoneColor,
      roughness: 0.7,
      metalness: 0.1
    });

    var wallNorth = new THREE.Mesh(stoneGeom, stoneMat);
    wallNorth.position.z = -wallLength / 2;
    wallNorth.castShadow = true;
    wallNorth.receiveShadow = true;
    wallGroup.add(wallNorth);
    state.objects.push(wallNorth);

    var wallSouth = new THREE.Mesh(stoneGeom, stoneMat);
    wallSouth.position.z = wallLength / 2;
    wallSouth.castShadow = true;
    wallSouth.receiveShadow = true;
    wallGroup.add(wallSouth);
    state.objects.push(wallSouth);

    var wallWest = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, wallLength),
      stoneMat
    );
    wallWest.position.x = -wallLength / 2;
    wallWest.castShadow = true;
    wallWest.receiveShadow = true;
    wallGroup.add(wallWest);
    state.objects.push(wallWest);

    var wallEast = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, wallLength),
      stoneMat
    );
    wallEast.position.x = wallLength / 2;
    wallEast.castShadow = true;
    wallEast.receiveShadow = true;
    wallGroup.add(wallEast);
    state.objects.push(wallEast);

    createBattlements(wallGroup, wallNorth, wallLength, wallThickness);
    createBattlements(wallGroup, wallSouth, wallLength, wallThickness);
    createBattlementsVertical(wallGroup, wallWest, wallLength, wallThickness);
    createBattlementsVertical(wallGroup, wallEast, wallLength, wallThickness);

    state.scene.add(wallGroup);
    return wallGroup;
  }

  function createBattlements(group, wall, length, thickness) {
    var meralonHeight = 3;
    var meralonWidth = 3;
    var spacing = 6;
    var meralonMat = new THREE.MeshStandardMaterial({
      color: config.stoneColor,
      roughness: 0.7,
      metalness: 0.1
    });

    var startX = -length / 2 + spacing;
    for (var i = startX; i < length / 2; i += spacing * 2) {
      var merlon = new THREE.Mesh(
        new THREE.BoxGeometry(meralonWidth, meralonHeight, thickness),
        meralonMat
      );
      merlon.position.x = i;
      merlon.position.y = wall.geometry.parameters.height / 2 + meralonHeight / 2;
      merlon.position.z = wall.position.z;
      merlon.castShadow = true;
      merlon.receiveShadow = true;
      group.add(merlon);
      state.objects.push(merlon);
    }
  }

  function createBattlementsVertical(group, wall, length, thickness) {
    var meralonHeight = 3;
    var meralonWidth = 3;
    var spacing = 6;
    var meralonMat = new THREE.MeshStandardMaterial({
      color: config.stoneColor,
      roughness: 0.7,
      metalness: 0.1
    });

    var startZ = -length / 2 + spacing;
    for (var i = startZ; i < length / 2; i += spacing * 2) {
      var merlon = new THREE.Mesh(
        new THREE.BoxGeometry(thickness, meralonHeight, meralonWidth),
        meralonMat
      );
      merlon.position.x = wall.position.x;
      merlon.position.y = wall.geometry.parameters.height / 2 + meralonHeight / 2;
      merlon.position.z = i;
      merlon.castShadow = true;
      merlon.receiveShadow = true;
      group.add(merlon);
      state.objects.push(merlon);
    }
  }

  function createCornerTowers() {
    var towerGroup = new THREE.Group();
    var towerRadius = 5;
    var towerHeight = 20;
    var towerGeom = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16);
    var towerMat = new THREE.MeshStandardMaterial({
      color: config.darkStoneColor,
      roughness: 0.8,
      metalness: 0.05
    });

    var corners = [
      { x: -40, z: -40 },
      { x: 40, z: -40 },
      { x: -40, z: 40 },
      { x: 40, z: 40 }
    ];

    for (var i = 0; i < corners.length; i++) {
      var tower = new THREE.Mesh(towerGeom, towerMat);
      tower.position.x = corners[i].x;
      tower.position.z = corners[i].z;
      tower.position.y = towerHeight / 2;
      tower.castShadow = true;
      tower.receiveShadow = true;
      towerGroup.add(tower);
      state.objects.push(tower);

      var roofGeom = new THREE.ConeGeometry(towerRadius + 0.5, 4, 16);
      var roofMat = new THREE.MeshStandardMaterial({
        color: 0x3a3025,
        roughness: 0.9
      });
      var roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.x = corners[i].x;
      roof.position.z = corners[i].z;
      roof.position.y = towerHeight + 2;
      roof.castShadow = true;
      roof.receiveShadow = true;
      towerGroup.add(roof);
      state.objects.push(roof);
    }

    state.scene.add(towerGroup);
    return towerGroup;
  }

  function createKeep() {
    var keepGroup = new THREE.Group();
    var keepWidth = 25;
    var keepDepth = 25;
    var keepHeight = 35;
    var keepGeom = new THREE.BoxGeometry(keepWidth, keepHeight, keepDepth);
    var keepMat = new THREE.MeshStandardMaterial({
      color: config.darkStoneColor,
      roughness: 0.8,
      metalness: 0.05
    });

    var keep = new THREE.Mesh(keepGeom, keepMat);
    keep.position.y = keepHeight / 2;
    keep.castShadow = true;
    keep.receiveShadow = true;
    keepGroup.add(keep);
    state.objects.push(keep);

    var roofGeom = new THREE.ConeGeometry(Math.sqrt(keepWidth * keepWidth + keepDepth * keepDepth) / 2, 6, 4);
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x2a1f15,
      roughness: 0.9
    });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = keepHeight + 3;
    roof.castShadow = true;
    roof.receiveShadow = true;
    keepGroup.add(roof);
    state.objects.push(roof);

    createFlag(keepGroup, keepWidth / 2, keepHeight + 7, 0);

    state.scene.add(keepGroup);
    return keepGroup;
  }

  function createFlag(parent, x, y, z) {
    var flagPoleGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    var metalMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.5,
      metalness: 0.8
    });
    var flagPole = new THREE.Mesh(flagPoleGeom, metalMat);
    flagPole.position.set(x, y, z);
    flagPole.castShadow = true;
    flagPole.receiveShadow = true;
    parent.add(flagPole);
    state.objects.push(flagPole);

    var flagGeom = new THREE.BoxGeometry(8, 5, 0.2);
    var flagMat = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      roughness: 0.6,
      emissive: 0x4a0000
    });
    var flag = new THREE.Mesh(flagGeom, flagMat);
    flag.position.set(x + 4, y, z);
    flag.castShadow = true;
    flag.receiveShadow = true;
    parent.add(flag);
    state.objects.push(flag);
    flag.userData.isFlag = true;
  }

  function createDrawbridge() {
    var bridgeGroup = new THREE.Group();
    var bridgeWidth = 12;
    var bridgeDepth = 6;
    var bridgeThickness = 0.5;

    var bridgeGeom = new THREE.BoxGeometry(bridgeWidth, bridgeThickness, bridgeDepth);
    var bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.8,
      metalness: 0.1
    });

    var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
    bridge.position.set(0, 2, -43);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    bridge.userData.isDrawbridge = true;
    bridgeGroup.add(bridge);
    state.objects.push(bridge);

    var chainsGeom = new THREE.BoxGeometry(0.2, 8, 0.2);
    var chainMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.3
    });

    for (var i = 0; i < 4; i++) {
      var chain = new THREE.Mesh(chainsGeom, chainMat);
      chain.position.set(-4 + i * 3, 6, -43);
      chain.castShadow = true;
      chain.receiveShadow = true;
      bridgeGroup.add(chain);
      state.objects.push(chain);
    }

    state.scene.add(bridgeGroup);
    state.drawbridge = bridge;
    return bridgeGroup;
  }

  function createPortcullis() {
    var portcullisGroup = new THREE.Group();
    var gridSize = 4;
    var cellSize = 2;
    var barThickness = 0.3;
    var barMat = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 3 });

    var points = [];
    for (var i = 0; i <= gridSize; i++) {
      for (var j = 0; j <= gridSize; j++) {
        points.push(
          new THREE.Vector3(
            -gridSize * cellSize / 2 + i * cellSize,
            10 - j * cellSize,
            -45
          )
        );
      }
    }

    for (var i = 0; i <= gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        var idx = i * (gridSize + 1) + j;
        var p1 = points[idx];
        var p2 = points[idx + 1];
        var lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute('position', new THREE.BufferAttribute(
          new Float32Array([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z]),
          3
        ));
        var line = new THREE.LineSegments(lineGeom, barMat);
        portcullisGroup.add(line);
        state.objects.push(line);
      }
    }

    for (var j = 0; j <= gridSize; j++) {
      for (var i = 0; i < gridSize; i++) {
        var idx = i * (gridSize + 1) + j;
        var p1 = points[idx];
        var p2 = points[(i + 1) * (gridSize + 1) + j];
        var lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute('position', new THREE.BufferAttribute(
          new Float32Array([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z]),
          3
        ));
        var line = new THREE.LineSegments(lineGeom, barMat);
        portcullisGroup.add(line);
        state.objects.push(line);
      }
    }

    state.scene.add(portcullisGroup);
    return portcullisGroup;
  }

  function createMoat() {
    var moatGroup = new THREE.Group();
    var moatWidth = 100;
    var moatDepth = 100;
    var moatDepthY = 4;

    var moatGeom = new THREE.BoxGeometry(moatWidth, moatDepthY, moatDepth);
    var moatMat = new THREE.MeshStandardMaterial({
      color: config.moatColor,
      roughness: 0.4,
      metalness: 0.3
    });

    var moat = new THREE.Mesh(moatGeom, moatMat);
    moat.position.y = -moatDepthY / 2;
    moat.receiveShadow = true;
    moatGroup.add(moat);
    state.objects.push(moat);

    var waterGeom = new THREE.BoxGeometry(moatWidth - 2, 0.2, moatDepth - 2);
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x0d1f2d,
      roughness: 0.2,
      metalness: 0.4,
      emissive: 0x1a3a4a
    });
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.y = -1;
    water.receiveShadow = true;
    moatGroup.add(water);
    state.objects.push(water);

    state.scene.add(moatGroup);
    return moatGroup;
  }

  function createCourtyard() {
    var courtyardGroup = new THREE.Group();
    var courtyardWidth = 60;
    var courtyardDepth = 60;
    var courtyardThickness = 0.2;

    var courtyardGeom = new THREE.BoxGeometry(courtyardWidth, courtyardThickness, courtyardDepth);
    var courtyardMat = new THREE.MeshStandardMaterial({
      color: 0x8b7765,
      roughness: 0.8,
      metalness: 0.0
    });

    var courtyard = new THREE.Mesh(courtyardGeom, courtyardMat);
    courtyard.position.y = 0.1;
    courtyard.receiveShadow = true;
    courtyardGroup.add(courtyard);
    state.objects.push(courtyard);

    state.scene.add(courtyardGroup);
    return courtyardGroup;
  }

  function createEnemies() {
    var enemyGroup = new THREE.Group();
    var totalEnemies = state.gameState.totalEnemies;
    var positions = [
      { x: -20, z: -15 },
      { x: -10, z: 0 },
      { x: 0, z: 10 },
      { x: 10, z: -5 },
      { x: 20, z: 5 },
      { x: 15, z: 15 },
      { x: -15, z: 20 },
      { x: 5, z: -20 },
      { x: -25, z: -25 },
      { x: 25, z: -15 },
      { x: -30, z: 10 },
      { x: 30, z: 20 }
    ];

    for (var i = 0; i < totalEnemies; i++) {
      var bodyGeom = new THREE.BoxGeometry(1.5, 4, 1);
      var bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.6,
        metalness: 0.3
      });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(positions[i % positions.length].x, 2, positions[i % positions.length].z);
      body.castShadow = true;
      body.receiveShadow = true;
      body.userData.isEnemy = true;
      body.userData.health = 100;
      body.userData.index = i;
      enemyGroup.add(body);
      state.objects.push(body);
      state.enemies.push(body);

      var headGeom = new THREE.SphereGeometry(0.5, 8, 8);
      var headMat = new THREE.MeshStandardMaterial({
        color: 0xd4a574,
        roughness: 0.7
      });
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.set(positions[i % positions.length].x, 4.2, positions[i % positions.length].z);
      head.castShadow = true;
      head.receiveShadow = true;
      enemyGroup.add(head);
      state.objects.push(head);

      var weaponGeom = new THREE.BoxGeometry(0.3, 1.5, 0.15);
      var weaponMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.9,
        roughness: 0.2
      });
      var weapon = new THREE.Mesh(weaponGeom, weaponMat);
      weapon.position.set(positions[i % positions.length].x + 0.5, 3, positions[i % positions.length].z);
      weapon.castShadow = true;
      weapon.receiveShadow = true;
      enemyGroup.add(weapon);
      state.objects.push(weapon);
    }

    state.scene.add(enemyGroup);
    return enemyGroup;
  }

  function createTorches() {
    var torchGroup = new THREE.Group();
    var positions = [
      { x: -35, z: -40, y: 8 },
      { x: 35, z: -40, y: 8 },
      { x: -35, z: 40, y: 8 },
      { x: 35, z: 40, y: 8 },
      { x: -40, z: -10, y: 8 },
      { x: -40, z: 10, y: 8 },
      { x: 40, z: -10, y: 8 },
      { x: 40, z: 10, y: 8 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
      var poleMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        metalness: 0.7,
        roughness: 0.4
      });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(positions[i].x, positions[i].y, positions[i].z);
      pole.castShadow = true;
      pole.receiveShadow = true;
      torchGroup.add(pole);
      state.objects.push(pole);

      var flameGeom = new THREE.SphereGeometry(0.5, 8, 8);
      var flameMat = new THREE.MeshStandardMaterial({
        color: 0xff8800,
        emissive: 0xff6600,
        emissiveIntensity: 0.8,
        roughness: 0.4,
        metalness: 0.1
      });
      var flame = new THREE.Mesh(flameGeom, flameMat);
      flame.position.set(positions[i].x, positions[i].y + 2, positions[i].z);
      flame.castShadow = true;
      flame.receiveShadow = true;
      flame.userData.isTorch = true;
      flame.userData.baseIntensity = 0.8;
      torchGroup.add(flame);
      state.objects.push(flame);
      state.torches.push(flame);

      var lightGeom = new THREE.PointLight(config.torchColor, 1.5, 25);
      lightGeom.position.set(positions[i].x, positions[i].y + 2, positions[i].z);
      lightGeom.castShadow = true;
      torchGroup.add(lightGeom);
      flame.userData.light = lightGeom;
    }

    state.scene.add(torchGroup);
    return torchGroup;
  }

  function setupLighting() {
    var ambientLight = new THREE.AmbientLight(0xd4a574, 0.6);
    state.scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xf5deb3, 1.2);
    directionalLight.position.set(40, 60, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    state.scene.add(directionalLight);
  }

  function setupFog() {
    state.scene.fog = new THREE.Fog(config.mistColor, 150, 400);
  }

  function setupHUD() {
    if (HUDElement) {
      HUDElement.remove();
    }

    HUDElement = document.createElement('div');
    HUDElement.id = 'medieval-fortress-hud';
    HUDElement.style.position = 'fixed';
    HUDElement.style.top = '20px';
    HUDElement.style.left = '20px';
    HUDElement.style.fontFamily = 'monospace';
    HUDElement.style.color = '#ff8800';
    HUDElement.style.fontSize = '16px';
    HUDElement.style.textShadow = '0 0 10px rgba(255, 136, 0, 0.8)';
    HUDElement.style.zIndex = '10000';
    HUDElement.style.lineHeight = '1.8';
    HUDElement.style.display = state.hudEnabled ? 'block' : 'none';
    HUDElement.style.pointerEvents = 'none';

    updateHUD();
    document.body.appendChild(HUDElement);
  }

  function updateHUD() {
    if (!HUDElement) return;

    var gateStatus = state.gameState.gateBreached ? 'YES' : 'NO';
    var cacheStatus = state.gameState.weaponsCacheFound ? 'YES' : 'NO';
    var enemyCount = state.gameState.extremistsDown + '/' + state.gameState.totalEnemies;

    HUDElement.innerHTML =
      'GATE BREACHED: ' + gateStatus + '<br/>' +
      'EXTREMISTS DOWN: ' + enemyCount + '<br/>' +
      'WEAPONS CACHE FOUND: ' + cacheStatus;
  }

  function handleKeybind(key) {
    var now = Date.now();

    if (key === 'm' || key === 'M') {
      state.keybind.lastM = now;
    } else if (key === 'f' || key === 'F') {
      state.keybind.lastF = now;
    }

    if (state.keybind.lastM && state.keybind.lastF) {
      var timeDiff = Math.abs(state.keybind.lastF - state.keybind.lastM);
      if (timeDiff < state.keybind.threshold) {
        state.hudEnabled = !state.hudEnabled;
        if (HUDElement) {
          HUDElement.style.display = state.hudEnabled ? 'block' : 'none';
        }
        state.keybind.lastM = null;
        state.keybind.lastF = null;
      }
    }
  }

  function animateDrawbridge(delta) {
    if (!state.drawbridge) return;

    if (state.drawbridgeOpen) {
      state.animations.drawbridgeAngle = Math.min(
        state.animations.drawbridgeAngle + delta * state.animations.drawbridgeSpeed,
        Math.PI / 2
      );
    } else {
      state.animations.drawbridgeAngle = Math.max(
        state.animations.drawbridgeAngle - delta * state.animations.drawbridgeSpeed,
        0
      );
    }

    state.drawbridge.rotation.x = state.animations.drawbridgeAngle;
  }

  function animateTorches(delta) {
    state.animations.torchFlicker += delta;

    for (var i = 0; i < state.torches.length; i++) {
      var torch = state.torches[i];
      var flicker = Math.sin(state.animations.torchFlicker * 3.5 + i) * 0.2 + 0.8;
      torch.material.emissiveIntensity = torch.userData.baseIntensity * flicker;

      if (torch.userData.light) {
        torch.userData.light.intensity = 1.5 * flicker;
      }
    }
  }

  function animateFlag(delta) {
    state.animations.flagWave += delta;

    for (var i = 0; i < state.objects.length; i++) {
      if (state.objects[i].userData.isFlag) {
        state.objects[i].rotation.z = Math.sin(state.animations.flagWave * 2) * 0.3;
      }
    }
  }

  function setupKeyboardListener() {
    document.addEventListener('keydown', function(event) {
      handleKeybind(event.key);
    });
  }

  function init(scene, camera) {
    state.scene = scene;
    state.camera = camera;

    state.scene.background = new THREE.Color(0x3a3025);
    setupFog();
    setupLighting();

    createCourtyard();
    createMoat();
    createWalls();
    createCornerTowers();
    createKeep();
    createDrawbridge();
    createPortcullis();
    createTorches();
    createEnemies();

    setupHUD();
    setupKeyboardListener();

    state.gameState.gateBreached = false;
    state.gameState.extremistsDown = 0;
    state.gameState.weaponsCacheFound = false;

    return true;
  }

  function update(delta) {
    animateDrawbridge(delta);
    animateTorches(delta);
    animateFlag(delta);

    for (var i = 0; i < state.enemies.length; i++) {
      var enemy = state.enemies[i];
      enemy.position.x += Math.sin(state.animations.torchFlicker + i) * 0.05;
      enemy.position.z += Math.cos(state.animations.torchFlicker + i) * 0.05;
    }

    updateHUD();
  }

  function reset() {
    for (var i = state.objects.length - 1; i >= 0; i--) {
      var obj = state.objects[i];
      if (obj.parent) {
        obj.parent.remove(obj);
      }
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var j = 0; j < obj.material.length; j++) {
            obj.material[j].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
    }

    state.objects = [];
    state.enemies = [];
    state.torches = [];
    state.drawbridge = null;
    state.drawbridgeOpen = false;
    state.gameState = {
      gateBreached: false,
      extremistsDown: 0,
      totalEnemies: 12,
      weaponsCacheFound: false
    };
    state.animations = {
      drawbridgeAngle: 0,
      drawbridgeSpeed: 1.5,
      torchFlicker: 0,
      flagWave: 0
    };

    if (HUDElement) {
      HUDElement.remove();
      HUDElement = null;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
