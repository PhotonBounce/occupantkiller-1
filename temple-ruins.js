window.TempleRuins = (function() {
  'use strict';

  var gameState = {
    artifactsRecovered: 0,
    guerrillasDown: 0,
    currentSector: 'OUTER',
    hudVisible: true,
    keybindBuffer: [],
    lastKeyTime: 0
  };

  var sceneObjects = [];
  var enemies = [];
  var scene = null;
  var camera = null;
  var hudCanvas = null;
  var hudContext = null;

  var KEYBIND_TIMEOUT = 400;
  var ARTIFACT_TOTAL = 4;

  function createTempleColumns(scene) {
    var columns = [];
    var positions = [
      { x: -10, z: -15 },
      { x: 10, z: -15 },
      { x: -10, z: 15 },
      { x: 10, z: 15 },
      { x: 0, z: -20 },
      { x: 0, z: 20 }
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(1.5, 1.8, 8, 16);
      var material = new THREE.MeshStandardMaterial({ color: 0x8B8680, roughness: 0.8 });
      var column = new THREE.Mesh(geometry, material);
      column.position.set(pos.x, 4, pos.z);
      column.castShadow = true;
      column.receiveShadow = true;
      scene.add(column);
      columns.push(column);
      sceneObjects.push(column);
    });

    return columns;
  }

  function createStoneWalls(scene) {
    var walls = [];
    var wallData = [
      { x: -20, z: 0, rotation: Math.PI / 2 },
      { x: 20, z: 0, rotation: Math.PI / 2 },
      { x: 0, z: -25, rotation: 0 }
    ];

    wallData.forEach(function(data) {
      var geometry = new THREE.BoxGeometry(20, 6, 0.8);
      var material = new THREE.MeshStandardMaterial({ color: 0x7A6E66, roughness: 0.9 });
      var wall = new THREE.Mesh(geometry, material);
      wall.position.set(data.x, 3, data.z);
      wall.rotation.y = data.rotation;
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      walls.push(wall);
      sceneObjects.push(wall);

      for (var i = 0; i < 4; i++) {
        var gapGeometry = new THREE.BoxGeometry(1.5, 2, 0.9);
        var gapMaterial = new THREE.MeshStandardMaterial({ color: 0x2F2F2F });
        var gap = new THREE.Mesh(gapGeometry, gapMaterial);
        var offsetX = (i - 1.5) * 4;
        gap.position.set(data.x + offsetX, 3, data.z);
        gap.rotation.y = data.rotation;
        scene.add(gap);
        sceneObjects.push(gap);
      }
    });

    return walls;
  }

  function createPyramidBase(scene) {
    var tiers = [];
    var tierSizes = [
      { w: 16, h: 1.5, d: 16 },
      { w: 12, h: 1.5, d: 12 },
      { w: 8, h: 1.5, d: 8 },
      { w: 4, h: 1.5, d: 4 }
    ];

    var yOffset = 0;
    tierSizes.forEach(function(size, index) {
      var geometry = new THREE.BoxGeometry(size.w, size.h, size.d);
      var material = new THREE.MeshStandardMaterial({ color: 0x9B8B7E, roughness: 0.85 });
      var tier = new THREE.Mesh(geometry, material);
      tier.position.set(0, yOffset + size.h / 2, 0);
      tier.castShadow = true;
      tier.receiveShadow = true;
      scene.add(tier);
      tiers.push(tier);
      sceneObjects.push(tier);
      yOffset += size.h;
    });

    return tiers;
  }

  function createJungleVines(scene) {
    var vines = [];
    var vinePositions = [
      { x: -18, z: -10 },
      { x: 18, z: -10 },
      { x: -12, z: 5 },
      { x: 12, z: 5 },
      { x: 0, z: -18 }
    ];

    vinePositions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
      var material = new THREE.MeshStandardMaterial({ color: 0x4A6B47, roughness: 0.7 });
      var vine = new THREE.Mesh(geometry, material);
      vine.position.set(pos.x, 4, pos.z);
      vine.castShadow = true;
      vine.receiveShadow = true;
      scene.add(vine);
      vines.push(vine);
      sceneObjects.push(vine);
    });

    return vines;
  }

  function createAltar(scene) {
    var altarGroup = [];

    var baseGeometry = new THREE.BoxGeometry(6, 1, 6);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.5, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    altarGroup.push(base);
    sceneObjects.push(base);

    var topGeometry = new THREE.BoxGeometry(5.5, 0.8, 5.5);
    var topMaterial = new THREE.MeshStandardMaterial({ color: 0xA0826D, roughness: 0.75 });
    var top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(0, 1.5, 0);
    top.castShadow = true;
    top.receiveShadow = true;
    scene.add(top);
    altarGroup.push(top);
    sceneObjects.push(top);

    var pedestalGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 12);
    var pedestalMaterial = new THREE.MeshStandardMaterial({ color: 0x7A6E66, roughness: 0.8 });
    var pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
    pedestal.position.set(0, 2.5, 0);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    scene.add(pedestal);
    altarGroup.push(pedestal);
    sceneObjects.push(pedestal);

    return altarGroup;
  }

  function createStoneIdol(scene) {
    var idolGroup = [];
    var baseX = -8;
    var baseZ = 12;

    var bodyGeometry = new THREE.BoxGeometry(1.2, 2, 1);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x6B6660, roughness: 0.85 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(baseX, 1.5, baseZ);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    idolGroup.push(body);
    sceneObjects.push(body);

    var armLeftGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.5);
    var armMaterial = new THREE.MeshStandardMaterial({ color: 0x6B6660, roughness: 0.85 });
    var armLeft = new THREE.Mesh(armLeftGeometry, armMaterial);
    armLeft.position.set(baseX - 1, 1.8, baseZ);
    armLeft.castShadow = true;
    armLeft.receiveShadow = true;
    scene.add(armLeft);
    idolGroup.push(armLeft);
    sceneObjects.push(armLeft);

    var armRight = new THREE.Mesh(armLeftGeometry, armMaterial);
    armRight.position.set(baseX + 1, 1.8, baseZ);
    armRight.castShadow = true;
    armRight.receiveShadow = true;
    scene.add(armRight);
    idolGroup.push(armRight);
    sceneObjects.push(armRight);

    var headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    var headMaterial = new THREE.MeshStandardMaterial({ color: 0x5A5450, roughness: 0.85 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(baseX, 3.2, baseZ);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    idolGroup.push(head);
    sceneObjects.push(head);

    return idolGroup;
  }

  function createCampfire(scene) {
    var campfireGroup = [];

    var logsGeometry = new THREE.BoxGeometry(2, 0.3, 2);
    var logsMaterial = new THREE.MeshStandardMaterial({ color: 0x3D3D3D, roughness: 0.95 });
    var logs = new THREE.Mesh(logsGeometry, logsMaterial);
    logs.position.set(15, 0.2, -8);
    logs.castShadow = true;
    logs.receiveShadow = true;
    scene.add(logs);
    campfireGroup.push(logs);
    sceneObjects.push(logs);

    var flameGeometry = new THREE.ConeGeometry(0.8, 2.5, 12);
    var flameMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6B35,
      emissive: 0xFF4500,
      emissiveIntensity: 0.8,
      roughness: 0.3
    });
    var flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.set(15, 1.5, -8);
    flame.castShadow = true;
    flame.receiveShadow = true;
    scene.add(flame);
    campfireGroup.push(flame);
    sceneObjects.push(flame);

    var glowGeometry = new THREE.SphereGeometry(2, 16, 16);
    var glowMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6B35,
      emissive: 0xFF4500,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.3
    });
    var glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(15, 1.5, -8);
    scene.add(glow);
    campfireGroup.push(glow);
    sceneObjects.push(glow);

    campfireGroup.flame = flame;
    campfireGroup.glow = glow;

    return campfireGroup;
  }

  function createLanterns(scene) {
    var lanterns = [];
    var lanternPositions = [
      { x: -15, z: 20 },
      { x: 15, z: 20 },
      { x: -12, z: -12 },
      { x: 12, z: -12 }
    ];

    lanternPositions.forEach(function(pos) {
      var groupArray = [];

      var bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3D3D3D, roughness: 0.8 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, 3, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      groupArray.push(body);
      sceneObjects.push(body);

      var lightGeometry = new THREE.SphereGeometry(0.35, 16, 16);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        emissive: 0xFFA500,
        emissiveIntensity: 0.7,
        roughness: 0.3
      });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(pos.x, 3, pos.z);
      scene.add(light);
      groupArray.push(light);
      sceneObjects.push(light);

      groupArray.body = body;
      groupArray.light = light;
      groupArray.baseX = pos.x;
      groupArray.baseY = 3;
      groupArray.baseZ = pos.z;
      lanterns.push(groupArray);
    });

    return lanterns;
  }

  function createEnemies(scene) {
    var enemyList = [];
    var enemyPositions = [
      { x: 5, z: 5 },
      { x: -5, z: 10 },
      { x: 8, z: -12 },
      { x: -10, z: -8 }
    ];

    enemyPositions.forEach(function(pos) {
      var enemy = {};

      var bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.5);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4A5F3F, roughness: 0.8 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, 0.9, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      enemy.body = body;
      sceneObjects.push(body);

      var headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xB8956A, roughness: 0.7 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(pos.x, 2.1, pos.z);
      head.castShadow = true;
      head.receiveShadow = true;
      scene.add(head);
      enemy.head = head;
      sceneObjects.push(head);

      enemy.alive = true;
      enemy.walkTime = 0;
      enemy.walkSpeed = 0.01 + Math.random() * 0.01;
      enemy.direction = Math.random() * Math.PI * 2;

      enemyList.push(enemy);
    });

    return enemyList;
  }

  function createGround(scene) {
    var geometry = new THREE.BoxGeometry(60, 0.2, 60);
    var material = new THREE.MeshStandardMaterial({
      color: 0x5A5450,
      roughness: 0.95
    });
    var ground = new THREE.Mesh(geometry, material);
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
    sceneObjects.push(ground);
  }

  function createLighting(scene) {
    var skyLight = new THREE.DirectionalLight(0xFFFFFF, 0.6);
    skyLight.position.set(20, 30, 20);
    skyLight.castShadow = true;
    skyLight.shadow.mapSize.width = 2048;
    skyLight.shadow.mapSize.height = 2048;
    skyLight.shadow.camera.left = -40;
    skyLight.shadow.camera.right = 40;
    skyLight.shadow.camera.top = 40;
    skyLight.shadow.camera.bottom = -40;
    skyLight.shadow.camera.near = 0.1;
    skyLight.shadow.camera.far = 100;
    scene.add(skyLight);

    var ambientLight = new THREE.AmbientLight(0xB8B8B8, 0.4);
    scene.add(ambientLight);

    var pointLight = new THREE.PointLight(0xFF6B35, 0.8, 30);
    pointLight.position.set(15, 2, -8);
    scene.add(pointLight);

    var fogLight = new THREE.AmbientLight(0x6B8E6F, 0.3);
    scene.add(fogLight);
  }

  function createHUD() {
    var canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    canvas.style.position = 'fixed';
    canvas.style.bottom = '20px';
    canvas.style.left = '20px';
    canvas.style.zIndex = '1000';
    canvas.style.fontFamily = 'Arial, sans-serif';
    canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    canvas.style.padding = '10px';
    canvas.style.border = '2px solid #00FF00';
    document.body.appendChild(canvas);

    return { canvas: canvas, context: canvas.getContext('2d') };
  }

  function updateHUD() {
    if (!hudContext || !hudCanvas) return;

    hudContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
    hudContext.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

    if (!gameState.hudVisible) {
      hudContext.fillStyle = '#FF0000';
      hudContext.font = 'bold 24px Arial';
      hudContext.fillText('HUD: DISABLED', 20, 50);
      return;
    }

    hudContext.fillStyle = '#00FF00';
    hudContext.font = 'bold 20px Courier New';
    hudContext.fillText('TEMPLE SECTOR: ' + gameState.currentSector, 20, 40);
    hudContext.fillText('ARTIFACTS RECOVERED: ' + gameState.artifactsRecovered + '/' + ARTIFACT_TOTAL, 20, 70);
    hudContext.fillText('GUERRILLAS DOWN: ' + gameState.guerrillasDown, 20, 100);

    hudContext.fillStyle = '#FFFF00';
    hudContext.font = '14px Arial';
    hudContext.fillText('Press T+R (within 400ms) to toggle HUD', 20, 140);
  }

  function handleKeyDown(event) {
    if (event.code === 'KeyT' || event.code === 'KeyR') {
      var now = Date.now();
      gameState.keybindBuffer.push(event.code);

      if (gameState.keybindBuffer.length > 2) {
        gameState.keybindBuffer.shift();
      }

      if (gameState.keybindBuffer.length === 2 &&
          gameState.keybindBuffer[0] === 'KeyT' &&
          gameState.keybindBuffer[1] === 'KeyR' &&
          now - gameState.lastKeyTime < KEYBIND_TIMEOUT) {
        toggleHUD();
        gameState.keybindBuffer = [];
      }

      gameState.lastKeyTime = now;
    }
  }

  function toggleHUD() {
    gameState.hudVisible = !gameState.hudVisible;
    if (hudCanvas) {
      hudCanvas.style.display = gameState.hudVisible ? 'block' : 'block';
    }
    console.log('HUD toggled: ' + (gameState.hudVisible ? 'ON' : 'OFF'));
  }

  function updateCampfire(delta) {
    var campfire = sceneObjects.filter(function(obj) {
      return obj.geometry && obj.geometry.type === 'ConeGeometry';
    })[0];

    if (campfire) {
      var flameScale = 1 + Math.sin(Date.now() * 0.003) * 0.15;
      campfire.scale.y = flameScale;

      var emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.002) * 0.2;
      campfire.material.emissiveIntensity = emissiveIntensity;
    }
  }

  function updateLanterns(lanterns, delta) {
    lanterns.forEach(function(lantern) {
      var swayAmount = Math.sin(Date.now() * 0.002) * 0.05;
      lantern.body.rotation.z = swayAmount;
      lantern.light.rotation.z = swayAmount;

      var glowIntensity = 0.6 + Math.sin(Date.now() * 0.0015) * 0.1;
      lantern.light.material.emissiveIntensity = glowIntensity;
    });
  }

  function updateEnemies(enemies, delta) {
    enemies.forEach(function(enemy) {
      if (!enemy.alive) return;

      enemy.walkTime += delta;
      var distance = Math.sin(enemy.walkTime * enemy.walkSpeed) * 3;

      enemy.body.position.x = enemy.body.position.x + Math.cos(enemy.direction) * 0.01;
      enemy.body.position.z = enemy.body.position.z + Math.sin(enemy.direction) * 0.01;
      enemy.head.position.copy(enemy.body.position);
      enemy.head.position.y = 2.1;

      if (Math.random() < 0.001) {
        enemy.direction += (Math.random() - 0.5) * 0.5;
      }

      if (Math.abs(enemy.body.position.x) > 28) {
        enemy.direction = Math.PI - enemy.direction;
      }
      if (Math.abs(enemy.body.position.z) > 28) {
        enemy.direction = -enemy.direction;
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    scene.background = new THREE.Color(0x4A6B47);
    scene.fog = new THREE.Fog(0x6B8E6F, 50, 80);

    createGround(scene);
    createTempleColumns(scene);
    createStoneWalls(scene);
    createPyramidBase(scene);
    createJungleVines(scene);
    createAltar(scene);
    createStoneIdol(scene);
    var campfire = createCampfire(scene);
    var lanterns = createLanterns(scene);
    enemies = createEnemies(scene);

    createLighting(scene);

    var hud = createHUD();
    hudCanvas = hud.canvas;
    hudContext = hud.context;

    document.addEventListener('keydown', handleKeyDown);

    gameState.campfire = campfire;
    gameState.lanterns = lanterns;

    console.log('Temple Ruins initialized');
  }

  function update(delta) {
    if (!scene || !camera) return;

    updateHUD();
    updateCampfire(delta);
    updateLanterns(gameState.lanterns || [], delta);
    updateEnemies(enemies, delta);
  }

  function reset() {
    document.removeEventListener('keydown', handleKeyDown);

    sceneObjects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      if (scene) scene.remove(obj);
    });

    sceneObjects = [];
    enemies = [];

    if (hudCanvas && hudCanvas.parentNode) {
      hudCanvas.parentNode.removeChild(hudCanvas);
    }
    hudCanvas = null;
    hudContext = null;

    gameState = {
      artifactsRecovered: 0,
      guerrillasDown: 0,
      currentSector: 'OUTER',
      hudVisible: true,
      keybindBuffer: [],
      lastKeyTime: 0
    };

    scene = null;
    camera = null;

    console.log('Temple Ruins reset');
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getGameState: function() { return gameState; },
    setArtifactsRecovered: function(count) { gameState.artifactsRecovered = count; },
    setGuerrillasDown: function(count) { gameState.guerrillasDown = count; },
    setSector: function(sector) { gameState.currentSector = sector; }
  };
}());
