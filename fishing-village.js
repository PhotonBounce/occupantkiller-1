window.FishingVillage = (function() {
  'use strict';

  var sceneObjects = [];
  var isVisible = false;
  var keybindBuffer = [];
  var keybindTimeout = null;
  var lastUpdateTime = 0;
  var gameState = {
    captivesFreed: 0,
    shipDestroyed: 0,
    villageCleared: false,
    cameraPos: { x: 0, y: 0, z: 0 }
  };
  var animationStates = {};
  var hudElement = null;

  function createMaterial(color) {
    var mat = new THREE.MeshPhongMaterial({ color: color });
    return mat;
  }

  function addToScene(scene, mesh) {
    scene.add(mesh);
    sceneObjects.push(mesh);
    return mesh;
  }

  function createVillageHouses(scene) {
    var housePositions = [
      { x: -20, z: -15 },
      { x: -10, z: -20 },
      { x: 5, z: -18 },
      { x: 20, z: -16 },
      { x: 15, z: -8 }
    ];

    housePositions.forEach(function(pos) {
      var stillGeom = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
      var stillMat = createMaterial(0x8B4513);
      var stills = [
        new THREE.Mesh(stillGeom, stillMat),
        new THREE.Mesh(stillGeom, stillMat),
        new THREE.Mesh(stillGeom, stillMat),
        new THREE.Mesh(stillGeom, stillMat)
      ];

      stills[0].position.set(pos.x - 2, 4, pos.z - 2);
      stills[1].position.set(pos.x + 2, 4, pos.z - 2);
      stills[2].position.set(pos.x - 2, 4, pos.z + 2);
      stills[3].position.set(pos.x + 2, 4, pos.z + 2);

      stills.forEach(function(s) {
        addToScene(scene, s);
      });

      var houseGeom = new THREE.BoxGeometry(5, 4, 5);
      var houseMat = createMaterial(0xD2691E);
      var house = new THREE.Mesh(houseGeom, houseMat);
      house.position.set(pos.x, 10, pos.z);
      addToScene(scene, house);

      var roofGeom = new THREE.ConeGeometry(3.5, 2, 4);
      var roofMat = createMaterial(0x8B0000);
      var roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.set(pos.x, 12.5, pos.z);
      roof.rotation.y = Math.PI / 4;
      addToScene(scene, roof);
    });
  }

  function createCentralMarket(scene) {
    var groundGeom = new THREE.BoxGeometry(30, 0.5, 25);
    var groundMat = createMaterial(0xC4A747);
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.set(0, 0.25, 0);
    addToScene(scene, ground);

    var stallPositions = [
      { x: -10, z: 5 },
      { x: -5, z: 8 },
      { x: 0, z: 5 },
      { x: 5, z: 8 },
      { x: 10, z: 5 }
    ];

    stallPositions.forEach(function(pos) {
      var stallGeom = new THREE.BoxGeometry(3, 3, 3);
      var stallMat = createMaterial(0xF4A460);
      var stall = new THREE.Mesh(stallGeom, stallMat);
      stall.position.set(pos.x, 1.5, pos.z);
      addToScene(scene, stall);

      var roofGeom = new THREE.BoxGeometry(4, 0.5, 4);
      var roofMat = createMaterial(0xCD853F);
      var roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.set(pos.x, 3.5, pos.z);
      addToScene(scene, roof);
    });
  }

  function createFishingBoats(scene) {
    var boatPositions = [
      { x: -25, z: 15 },
      { x: -15, z: 20 },
      { x: 25, z: 18 }
    ];

    boatPositions.forEach(function(pos, idx) {
      var hullGeom = new THREE.BoxGeometry(3, 2, 8);
      var hullMat = createMaterial(0x1C1C1C);
      var hull = new THREE.Mesh(hullGeom, hullMat);
      hull.position.set(pos.x, 1.5, pos.z);
      addToScene(scene, hull);
      animationStates['boat_' + idx] = { time: 0, baseY: 1.5 };

      var mastGeom = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
      var mastMat = createMaterial(0x654321);
      var mast = new THREE.Mesh(mastGeom, mastMat);
      mast.position.set(pos.x, 5, pos.z);
      addToScene(scene, mast);

      var sailGeom = new THREE.BoxGeometry(0.1, 5, 4);
      var sailMat = createMaterial(0xFFFFFF);
      var sail = new THREE.Mesh(sailGeom, sailMat);
      sail.position.set(pos.x + 0.5, 5, pos.z - 1);
      addToScene(scene, sail);
      animationStates['sail_' + idx] = { time: 0 };
    });
  }

  function createPirateDhow(scene) {
    var hullGeom = new THREE.BoxGeometry(5, 3, 12);
    var hullMat = createMaterial(0x1a1a1a);
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(-35, 2, 25);
    addToScene(scene, hull);
    animationStates['dhow'] = { time: 0, baseY: 2 };

    var mastGeom = new THREE.CylinderGeometry(0.3, 0.3, 10, 8);
    var mastMat = createMaterial(0x8B4513);
    var mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.set(-35, 7, 22);
    addToScene(scene, mast);

    var sail1Geom = new THREE.BoxGeometry(0.1, 7, 5);
    var sailMat = createMaterial(0xB22222);
    var sail1 = new THREE.Mesh(sail1Geom, sailMat);
    sail1.position.set(-32.5, 7, 20);
    addToScene(scene, sail1);
    animationStates['dhow_sail'] = { time: 0 };

    var sail2Geom = new THREE.BoxGeometry(0.1, 5, 3);
    var sail2 = new THREE.Mesh(sail2Geom, sailMat);
    sail2.position.set(-37.5, 6, 24);
    addToScene(scene, sail2);
  }

  function createDockPier(scene) {
    var pierGeom = new THREE.BoxGeometry(40, 0.8, 6);
    var pierMat = createMaterial(0x8B4513);
    var pier = new THREE.Mesh(pierGeom, pierMat);
    pier.position.set(0, 0.4, 28);
    addToScene(scene, pier);

    var pillarPositions = [
      { x: -15 },
      { x: -5 },
      { x: 5 },
      { x: 15 }
    ];

    pillarPositions.forEach(function(pos) {
      var pillarGeom = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
      var pillarMat = createMaterial(0x654321);
      var pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(pos.x, 1.5, 28);
      addToScene(scene, pillar);
    });
  }

  function createFishDryingRacks(scene) {
    var positions = [
      { x: -30, z: 5 },
      { x: 30, z: 5 }
    ];

    positions.forEach(function(pos) {
      var poleGeom = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
      var poleMat = createMaterial(0x8B4513);
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(pos.x, 2.5, pos.z);
      addToScene(scene, pole);

      var points = [];
      for (var i = 0; i < 5; i++) {
        for (var j = 0; j < 4; j++) {
          points.push(new THREE.Vector3(pos.x - 2 + j, 3 + i * 0.8, pos.z));
        }
      }
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var lineMat = new THREE.LineBasicMaterial({ color: 0xFFEFCD });
      var grid = new THREE.LineSegments(geometry, lineMat);
      addToScene(scene, grid);
      animationStates['rack_' + pos.x] = { time: 0 };
    });
  }

  function createLobsterTrapPiles(scene) {
    var pilePositions = [
      { x: -20, z: 22 },
      { x: 20, z: 24 }
    ];

    pilePositions.forEach(function(pos) {
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
          var trapGeom = new THREE.BoxGeometry(1, 1, 1);
          var trapMat = createMaterial(0xFF8C00);
          var trap = new THREE.Mesh(trapGeom, trapMat);
          trap.position.set(pos.x + i * 1.2, 0.5 + j * 1.2, pos.z);
          addToScene(scene, trap);
        }
      }
    });
  }

  function createAnchor(scene) {
    var points = [
      new THREE.Vector3(10, 2, 20),
      new THREE.Vector3(12, 3, 20),
      new THREE.Vector3(11, 5, 20),
      new THREE.Vector3(13, 6, 20),
      new THREE.Vector3(12, 2, 20),
      new THREE.Vector3(14, 3, 20)
    ];
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0x696969 });
    var anchor = new THREE.LineSegments(geometry, lineMat);
    addToScene(scene, anchor);
  }

  function createFishingNet(scene) {
    var points = [];
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 6; j++) {
        points.push(new THREE.Vector3(-35 + i * 2, 8 - j * 1.5, -25));
      }
    }
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0xA9A9A9 });
    var net = new THREE.LineSegments(geometry, lineMat);
    addToScene(scene, net);
  }

  function createWaterTower(scene) {
    var legGeom = new THREE.BoxGeometry(0.8, 4, 0.8);
    var legMat = createMaterial(0x696969);
    var leg1 = new THREE.Mesh(legGeom, legMat);
    leg1.position.set(-5, 2, -20);
    addToScene(scene, leg1);

    var leg2 = new THREE.Mesh(legGeom, legMat);
    leg2.position.set(5, 2, -20);
    addToScene(scene, leg2);

    var tankGeom = new THREE.CylinderGeometry(3, 3, 2.5, 16);
    var tankMat = createMaterial(0x4169E1);
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(0, 5.5, -20);
    addToScene(scene, tank);
  }

  function createMosqueeMinaret(scene) {
    var baseGeom = new THREE.BoxGeometry(3, 1, 3);
    var baseMat = createMaterial(0xDAA520);
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(-30, 0.5, -22);
    addToScene(scene, base);

    var columnGeom = new THREE.CylinderGeometry(1.2, 1.2, 10, 12);
    var columnMat = createMaterial(0xFFD700);
    var column = new THREE.Mesh(columnGeom, columnMat);
    column.position.set(-30, 6, -22);
    addToScene(scene, column);

    var topGeom = new THREE.ConeGeometry(1.5, 3, 12);
    var topMat = createMaterial(0x228B22);
    var top = new THREE.Mesh(topGeom, topMat);
    top.position.set(-30, 11.5, -22);
    addToScene(scene, top);
  }

  function createWovenFence(scene) {
    var positions = [
      { x1: -40, z: -30, x2: -20, z2: -30 },
      { x1: 20, z: -30, x2: 40, z2: -30 }
    ];

    positions.forEach(function(pos) {
      var poleCount = Math.floor(Math.abs(pos.x2 - pos.x1) / 3);
      for (var i = 0; i < poleCount; i++) {
        var poleGeom = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
        var poleMat = createMaterial(0x8B4513);
        var pole = new THREE.Mesh(poleGeom, poleMat);
        var poleX = pos.x1 + (i * 3);
        pole.position.set(poleX, 1.5, pos.z);
        addToScene(scene, pole);
      }

      var points = [];
      for (var j = pos.x1; j <= pos.x2; j += 1) {
        points.push(new THREE.Vector3(j, 1.5, pos.z));
        points.push(new THREE.Vector3(j, 2.5, pos.z));
      }
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var lineMat = new THREE.LineBasicMaterial({ color: 0xA0522D });
      var fence = new THREE.LineSegments(geometry, lineMat);
      addToScene(scene, fence);
    });
  }

  function createCapitiveShed(scene) {
    var shedGeom = new THREE.BoxGeometry(6, 4, 8);
    var shedMat = createMaterial(0x8B4513);
    var shed = new THREE.Mesh(shedGeom, shedMat);
    shed.position.set(30, 2, -5);
    addToScene(scene, shed);

    var barPoints = [];
    for (var i = 0; i < 12; i++) {
      barPoints.push(new THREE.Vector3(27 + i * 0.5, 1, -5));
      barPoints.push(new THREE.Vector3(27 + i * 0.5, 4, -5));
    }
    var barGeom = new THREE.BufferGeometry().setFromPoints(barPoints);
    var barMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    var bars = new THREE.LineSegments(barGeom, barMat);
    addToScene(scene, bars);
  }

  function createGenerator(scene) {
    var genGeom = new THREE.BoxGeometry(2, 2, 3);
    var genMat = createMaterial(0xFF4500);
    var gen = new THREE.Mesh(genGeom, genMat);
    gen.position.set(35, 1, -10);
    addToScene(scene, gen);
    animationStates['generator'] = { time: 0, baseScale: 1 };
  }

  function createBeachSand(scene) {
    var sandGeom = new THREE.BoxGeometry(100, 0.2, 80);
    var sandMat = createMaterial(0xF4A460);
    var sand = new THREE.Mesh(sandGeom, sandMat);
    sand.position.set(0, -0.1, -15);
    addToScene(scene, sand);
  }

  function createOceanWater(scene) {
    var waterGeom = new THREE.BoxGeometry(120, 0.8, 100);
    var waterMat = createMaterial(0x1A4D8F);
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.set(0, 0, 20);
    addToScene(scene, water);
    animationStates['water'] = { time: 0, baseY: 0 };
  }

  function createCampfire(scene) {
    var logGeom = new THREE.BoxGeometry(0.3, 0.3, 2);
    var logMat = createMaterial(0x8B4513);
    var log1 = new THREE.Mesh(logGeom, logMat);
    log1.position.set(25, 0.5, -20);
    addToScene(scene, log1);

    var log2 = new THREE.Mesh(logGeom, logMat);
    log2.position.set(25, 0.5, -18);
    log2.rotation.z = Math.PI / 4;
    addToScene(scene, log2);

    var flameGeom = new THREE.ConeGeometry(0.8, 2, 8);
    var flameMat = createMaterial(0xFF4500);
    var flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.set(25, 2, -19);
    addToScene(scene, flame);
    animationStates['campfire'] = { time: 0 };
  }

  function createEnemies(scene) {
    var enemyPositions = [
      { x: -15, z: 0 },
      { x: 10, z: 5 },
      { x: 25, z: 10 },
      { x: -25, z: 18 },
      { x: 32, z: -15 }
    ];

    enemyPositions.forEach(function(pos, idx) {
      var bodyGeom = new THREE.BoxGeometry(1, 2, 0.8);
      var bodyMat = createMaterial(0x4169E1);
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(pos.x, 1, pos.z);
      addToScene(scene, body);

      var headGeom = new THREE.SphereGeometry(0.5, 8, 8);
      var headMat = createMaterial(0xD2B48C);
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.set(pos.x, 2.5, pos.z);
      addToScene(scene, head);

      var armGeom = new THREE.BoxGeometry(0.4, 1.5, 0.4);
      var armMat = createMaterial(0xD2B48C);
      var leftArm = new THREE.Mesh(armGeom, armMat);
      leftArm.position.set(pos.x - 1, 1.2, pos.z);
      addToScene(scene, leftArm);

      var rightArm = new THREE.Mesh(armGeom, armMat);
      rightArm.position.set(pos.x + 1, 1.2, pos.z);
      addToScene(scene, rightArm);
    });
  }

  function updateAnimations(delta) {
    var time = lastUpdateTime;

    Object.keys(animationStates).forEach(function(key) {
      var state = animationStates[key];
      state.time += delta;

      if (key.indexOf('boat_') === 0) {
        var boatMesh = sceneObjects[sceneObjects.length - 20 + parseInt(key.split('_')[1])];
        if (boatMesh) {
          boatMesh.position.y = state.baseY + Math.sin(state.time * 2) * 0.3;
        }
      }

      if (key === 'dhow') {
        var dhowMesh = sceneObjects.find(function(m) { return m.position && m.position.x === -35 && m.position.z === 25; });
        if (dhowMesh) {
          dhowMesh.position.y = state.baseY + Math.sin(state.time * 1.5) * 0.4;
        }
      }

      if (key.indexOf('sail_') === 0 || key === 'dhow_sail') {
        var sailMesh = sceneObjects.find(function(m, i) {
          return sceneObjects[i - 1] && sceneObjects[i - 1].position &&
                 sceneObjects[i].position && Math.abs(sceneObjects[i].position.x) > 30;
        });
        if (sailMesh) {
          sailMesh.rotation.z = Math.sin(state.time * 3) * 0.15;
        }
      }

      if (key === 'water') {
        var waterMesh = sceneObjects[sceneObjects.length - 5];
        if (waterMesh) {
          waterMesh.position.y = state.baseY + Math.sin(state.time * 0.8) * 0.2;
        }
      }

      if (key === 'generator') {
        var genMesh = sceneObjects[sceneObjects.length - 1];
        if (genMesh) {
          genMesh.scale.set(state.baseScale + Math.sin(state.time * 5) * 0.02,
                            state.baseScale + Math.sin(state.time * 5) * 0.02,
                            state.baseScale + Math.sin(state.time * 5) * 0.02);
        }
      }

      if (key === 'campfire') {
        var flameMesh = sceneObjects[sceneObjects.length - 2];
        if (flameMesh) {
          flameMesh.scale.y = 1 + Math.sin(state.time * 4) * 0.3;
        }
      }

      if (key.indexOf('rack_') === 0) {
        state.swayAngle = Math.sin(state.time * 2.5) * 0.08;
      }
    });

    lastUpdateTime += delta;
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'fishing-village-hud';
      hudElement.style.cssText = 'position: fixed; top: 20px; left: 20px; color: #FFF; font-family: monospace; font-size: 16px; background: rgba(0,0,0,0.7); padding: 15px; border: 2px solid #FFD700; display: none; z-index: 10000;';
      document.body.appendChild(hudElement);
    }

    var hudText = 'FISHING VILLAGE\n';
    hudText += '================\n';
    hudText += 'CAPTIVES FREED: ' + gameState.captivesFreed + '/5\n';
    hudText += 'PIRATE SHIPS DESTROYED: ' + gameState.shipDestroyed + '/3\n';
    hudText += 'VILLAGE CLEARED: ' + (gameState.villageCleared ? 'YES' : 'NO') + '\n';
    hudText += '================\n';
    hudText += 'PRESS F then V to toggle';

    hudElement.textContent = hudText;
  }

  function toggleHUD(scene, camera) {
    isVisible = !isVisible;
    if (isVisible && hudElement) {
      hudElement.style.display = 'block';
    } else if (hudElement) {
      hudElement.style.display = 'none';
    }
  }

  function handleKeybind(event) {
    var now = Date.now();
    keybindBuffer.push(event.key.toLowerCase());

    if (keybindTimeout) {
      clearTimeout(keybindTimeout);
    }

    keybindTimeout = setTimeout(function() {
      keybindBuffer = [];
    }, 400);

    if (keybindBuffer.length >= 2) {
      var last2 = keybindBuffer.slice(-2).join('');
      if (last2 === 'fv') {
        keybindBuffer = [];
        clearTimeout(keybindTimeout);
        var scene = window.FishingVillage._currentScene;
        var camera = window.FishingVillage._currentCamera;
        if (scene && camera) {
          toggleHUD(scene, camera);
        }
      }
    }
  }

  function init(scene, camera) {
    window.FishingVillage._currentScene = scene;
    window.FishingVillage._currentCamera = camera;

    lastUpdateTime = 0;
    sceneObjects = [];
    gameState = {
      captivesFreed: 0,
      shipDestroyed: 0,
      villageCleared: false,
      cameraPos: { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    };
    animationStates = {};
    isVisible = false;

    createBeachSand(scene);
    createOceanWater(scene);
    createCentralMarket(scene);
    createVillageHouses(scene);
    createFishingBoats(scene);
    createPirateDhow(scene);
    createDockPier(scene);
    createFishDryingRacks(scene);
    createLobsterTrapPiles(scene);
    createAnchor(scene);
    createFishingNet(scene);
    createWaterTower(scene);
    createMosqueeMinaret(scene);
    createWovenFence(scene);
    createCapitiveShed(scene);
    createGenerator(scene);
    createCampfire(scene);
    createEnemies(scene);

    createHUD();

    document.addEventListener('keydown', handleKeybind, false);
  }

  function update(delta) {
    updateAnimations(delta);
    if (hudElement && isVisible) {
      createHUD();
    }
  }

  function reset() {
    sceneObjects.forEach(function(mesh) {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
    });
    sceneObjects = [];
    animationStates = {};

    if (hudElement) {
      hudElement.style.display = 'none';
    }

    document.removeEventListener('keydown', handleKeybind, false);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
