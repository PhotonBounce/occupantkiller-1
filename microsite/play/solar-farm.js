window.SolarFarm = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var gameObjects = [];
  var saboteurs = [];
  var saboteurSpawnCounter = 0;
  var saboteurSpawnInterval = 3000;
  var lastSpawnTime = 0;
  var sabotageCount = 0;
  var saboteurStopCount = 0;
  var panelsTotal = 20;
  var panelsProtected = 20;
  var powerOutput = 100;
  var heliostatsArray = [];
  var panelArrays = [];
  var explosiveWarnings = [];
  var keybindState = '';
  var keybindTimeout = null;
  var hudElement = null;

  function createObject(geometry, material, x, y, z) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    gameObjects.push(mesh);
    return mesh;
  }

  function createLineSegments(points, color) {
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var line = new THREE.LineSegments(geometry, material);
    scene.add(line);
    gameObjects.push(line);
    return line;
  }

  function initSolarPanels() {
    var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.3, metalness: 0.7 });
    var rows = 4;
    var cols = 5;
    var panelWidth = 3;
    var panelHeight = 0.3;
    var panelDepth = 2;
    var spacing = 5;
    var startX = -10;
    var startZ = -15;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var geometry = new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth);
        var panelMesh = createObject(geometry, panelMaterial, startX + c * spacing, 3, startZ + r * spacing);
        panelMesh.rotation.z = 0.4;
        panelMesh.userData.originalRotation = { x: panelMesh.rotation.x, y: panelMesh.rotation.y, z: panelMesh.rotation.z };
        panelMesh.userData.tiltPhase = Math.random() * Math.PI * 2;
        panelArrays.push(panelMesh);
      }
    }
  }

  function initCentralPowerTower() {
    var towerGeometry = new THREE.CylinderGeometry(1.5, 2, 25, 16);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 });
    var tower = createObject(towerGeometry, towerMaterial, 0, 12.5, 0);
    tower.userData.isTower = true;

    var collectorGeometry = new THREE.SphereGeometry(2, 16, 16);
    var collectorMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.4, metalness: 0.8 });
    var collector = createObject(collectorGeometry, collectorMaterial, 0, 27, 0);
    collector.userData.isCollector = true;
    heliostatsArray.push(collector);
  }

  function initParabolicTroughs() {
    var troughSpacing = 8;
    var troughCount = 3;
    var troughMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3e, roughness: 0.5, metalness: 0.6 });

    for (var i = 0; i < troughCount; i++) {
      var geometry = new THREE.BoxGeometry(2, 0.5, 12);
      var trough = createObject(geometry, troughMaterial, -12 + i * troughSpacing, 1.5, 20);
      trough.rotation.z = 0.3;
      trough.userData.isTrough = true;
    }
  }

  function initInverterStation() {
    var buildingGeometry = new THREE.BoxGeometry(8, 4, 6);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
    var building = createObject(buildingGeometry, buildingMaterial, 20, 2, 10);
    building.userData.isInverter = true;

    var tankGeometry = new THREE.CylinderGeometry(1, 1, 3, 8);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 });
    var tank1 = createObject(tankGeometry, tankMaterial, 22, 4, 8);
    var tank2 = createObject(tankGeometry, tankMaterial, 22, 4, 12);
    tank1.userData.isTank = true;
    tank2.userData.isTank = true;
  }

  function initTransmissionTowers() {
    var towerCount = 3;
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5 });
    var barMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });

    for (var i = 0; i < towerCount; i++) {
      var x = -25 + i * 30;
      var z = -30;

      var vGeometry = new THREE.BoxGeometry(0.3, 20, 0.3);
      var v1 = createObject(vGeometry, towerMaterial, x - 3, 10, z);
      var v2 = createObject(vGeometry, towerMaterial, x + 3, 10, z);

      var hGeometry = new THREE.BoxGeometry(6, 0.3, 0.3);
      var h = createObject(hGeometry, towerMaterial, x, 18, z);

      var crossPoints = [
        x - 3, 10, z, x + 3, 10, z,
        x - 3, 20, z, x + 3, 20, z,
        x - 3, 10, z, x - 3, 20, z,
        x + 3, 10, z, x + 3, 20, z
      ];
      createLineSegments(crossPoints, 0x888888);
    }
  }

  function initPerimeterFence() {
    var fenceRadius = 35;
    var postCount = 12;
    var postMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 });
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 1 });

    for (var i = 0; i < postCount; i++) {
      var angle = (i / postCount) * Math.PI * 2;
      var x = Math.cos(angle) * fenceRadius;
      var z = Math.sin(angle) * fenceRadius;

      var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
      var post = createObject(postGeometry, postMaterial, x, 2.5, z);
      post.userData.isFencePost = true;
    }

    var wirePoints = [];
    for (var i = 0; i <= postCount; i++) {
      var angle = (i / postCount) * Math.PI * 2;
      var x = Math.cos(angle) * fenceRadius;
      var z = Math.sin(angle) * fenceRadius;
      wirePoints.push(x, 4, z);
    }
    createLineSegments(wirePoints, 0x999999);
  }

  function initServiceRoad() {
    var roadGeometry = new THREE.BoxGeometry(4, 0.1, 40);
    var roadMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 });
    var road = createObject(roadGeometry, roadMaterial, 0, 0.05, 0);
    road.userData.isRoad = true;
  }

  function setupAtmosphere() {
    scene.background = new THREE.Color(0xf5a742);
    scene.fog = new THREE.Fog(0xf5a742, 80, 200);

    var sunLight = new THREE.DirectionalLight(0xffd89b, 1.2);
    sunLight.position.set(30, 40, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.far = 100;
    scene.add(sunLight);

    var ambientLight = new THREE.AmbientLight(0xffcc99, 0.6);
    scene.add(ambientLight);
  }

  function createSaboteur() {
    var saboteur = {};
    saboteur.group = new THREE.Group();

    var bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    saboteur.group.add(body);

    var headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({ color: 0xc9a961 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    saboteur.group.add(head);

    var armGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.15);
    var armMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 0.9, 0);
    saboteur.group.add(leftArm);

    var rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 0.9, 0);
    saboteur.group.add(rightArm);

    var x = Math.random() * 40 - 20;
    var z = Math.random() * 40 - 20;
    saboteur.group.position.set(x, 0, z);
    saboteur.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      0,
      (Math.random() - 0.5) * 5
    );
    saboteur.speed = 3;
    saboteur.targetPanel = null;
    saboteur.timeToAction = Math.random() * 2000 + 1000;
    saboteur.health = 1;
    saboteur.alive = true;

    scene.add(saboteur.group);
    gameObjects.push(saboteur.group);
    saboteurs.push(saboteur);

    return saboteur;
  }

  function plantExplosive(saboteur) {
    if (panelArrays.length === 0) return;

    var targetPanel = panelArrays[Math.floor(Math.random() * panelArrays.length)];
    if (targetPanel && targetPanel.userData && !targetPanel.userData.sabotaged) {
      targetPanel.userData.sabotaged = true;
      targetPanel.userData.warningStartTime = Date.now();
      explosiveWarnings.push({
        mesh: targetPanel,
        createdAt: Date.now()
      });
      sabotageCount++;
      panelsProtected = Math.max(0, panelsProtected - 1);
      powerOutput = Math.max(0, powerOutput - 5);
    }
  }

  function updateSaboteurs(delta) {
    var now = Date.now();

    for (var i = saboteurs.length - 1; i >= 0; i--) {
      var saboteur = saboteurs[i];
      if (!saboteur.alive) continue;

      saboteur.group.position.add(saboteur.velocity.clone().multiplyScalar(delta * saboteur.speed));

      var panelPos = null;
      if (panelArrays.length > 0) {
        panelPos = panelArrays[0].position;
      }

      if (panelPos) {
        var dirToPanel = new THREE.Vector3().subVectors(panelPos, saboteur.group.position).normalize();
        saboteur.velocity.x = dirToPanel.x;
        saboteur.velocity.z = dirToPanel.z;

        var distToPanel = saboteur.group.position.distanceTo(panelPos);
        if (distToPanel < 3) {
          saboteur.timeToAction -= delta * 1000;
          if (saboteur.timeToAction <= 0) {
            plantExplosive(saboteur);
            saboteur.timeToAction = Math.random() * 3000 + 2000;
          }
        }
      }

      if (saboteur.group.position.length() > 50) {
        saboteur.alive = false;
        scene.remove(saboteur.group);
        gameObjects = gameObjects.filter(function(obj) { return obj !== saboteur.group; });
      }
    }

    saboteurs = saboteurs.filter(function(s) { return s.alive; });
  }

  function updateAnimations(delta) {
    var time = Date.now() * 0.001;

    for (var i = 0; i < heliostatsArray.length; i++) {
      var heliostat = heliostatsArray[i];
      heliostat.rotation.y = time * 0.2;
      heliostat.rotation.x = Math.sin(time * 0.1) * 0.3;
    }

    for (var i = 0; i < panelArrays.length; i++) {
      var panel = panelArrays[i];
      var originalZ = panel.userData.originalRotation.z;
      var tiltAmount = Math.sin(time + panel.userData.tiltPhase) * 0.15;
      panel.rotation.z = originalZ + tiltAmount;
    }

    for (var i = explosiveWarnings.length - 1; i >= 0; i--) {
      var warning = explosiveWarnings[i];
      var elapsed = Date.now() - warning.createdAt;
      if (elapsed > 4000) {
        explosiveWarnings.splice(i, 1);
      } else {
        var intensity = Math.sin(elapsed / 200) * 0.5 + 0.5;
        warning.mesh.material.emissive.setHSL(0, 1, intensity * 0.3);
      }
    }
  }

  function updateHUD() {
    if (!hudElement) {
      hudElement = document.getElementById('solar-farm-hud');
      if (!hudElement) {
        hudElement = document.createElement('div');
        hudElement.id = 'solar-farm-hud';
        hudElement.style.position = 'fixed';
        hudElement.style.top = '20px';
        hudElement.style.left = '20px';
        hudElement.style.color = '#00ff00';
        hudElement.style.fontFamily = 'monospace';
        hudElement.style.fontSize = '14px';
        hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        hudElement.style.padding = '10px';
        hudElement.style.border = '2px solid #00ff00';
        hudElement.style.zIndex = '1000';
        document.body.appendChild(hudElement);
      }
    }

    var hudText = 'PANELS PROTECTED: ' + panelsProtected + '/' + panelsTotal + '\n';
    hudText += 'SABOTEURS STOPPED: ' + saboteurStopCount + '\n';
    hudText += 'POWER OUTPUT: ' + powerOutput + '%\n';
    hudText += 'SABOTEURS ACTIVE: ' + saboteurs.length;

    hudElement.textContent = hudText;
  }

  function handleKeybind(key) {
    key = key.toUpperCase();
    keybindState += key;

    if (keybindState.length > 2) {
      keybindState = keybindState.slice(-2);
    }

    if (keybindTimeout) {
      clearTimeout(keybindTimeout);
    }

    if (keybindState === 'SF') {
      toggleGameState();
      keybindState = '';
    } else {
      keybindTimeout = setTimeout(function() {
        keybindState = '';
      }, 400);
    }
  }

  function toggleGameState() {
    var notification = document.getElementById('solar-farm-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'solar-farm-notification';
      notification.style.position = 'fixed';
      notification.style.top = '50%';
      notification.style.left = '50%';
      notification.style.transform = 'translate(-50%, -50%)';
      notification.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      notification.style.color = '#00ff00';
      notification.style.padding = '20px 40px';
      notification.style.border = '3px solid #00ff00';
      notification.style.fontFamily = 'monospace';
      notification.style.fontSize = '18px';
      notification.style.zIndex = '2000';
      document.body.appendChild(notification);
    }

    notification.textContent = 'GAME STATE TOGGLED';
    notification.style.display = 'block';
    setTimeout(function() {
      notification.style.display = 'none';
    }, 1000);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    gameObjects = [];
    saboteurs = [];
    sabotageCount = 0;
    saboteurStopCount = 0;
    panelsProtected = 20;
    powerOutput = 100;
    heliostatsArray = [];
    panelArrays = [];
    explosiveWarnings = [];

    setupAtmosphere();
    initSolarPanels();
    initCentralPowerTower();
    initParabolicTroughs();
    initInverterStation();
    initTransmissionTowers();
    initPerimeterFence();
    initServiceRoad();

    document.addEventListener('keydown', function(e) {
      handleKeybind(e.key);
    });

    lastSpawnTime = Date.now();
  }

  function update(delta) {
    updateAnimations(delta);

    var now = Date.now();
    if (now - lastSpawnTime > saboteurSpawnInterval && saboteurs.length < 5) {
      createSaboteur();
      lastSpawnTime = now;
    }

    updateSaboteurs(delta);
    updateHUD();
  }

  function reset() {
    for (var i = gameObjects.length - 1; i >= 0; i--) {
      scene.remove(gameObjects[i]);
    }
    gameObjects = [];
    saboteurs = [];
    sabotageCount = 0;
    saboteurStopCount = 0;
    panelsProtected = 20;
    powerOutput = 100;
    heliostatsArray = [];
    panelArrays = [];
    explosiveWarnings = [];

    if (hudElement) {
      hudElement.style.display = 'none';
    }

    scene.background = new THREE.Color(0x000000);
    scene.fog = null;

    var lightsToRemove = [];
    scene.children.forEach(function(child) {
      if (child instanceof THREE.Light) {
        lightsToRemove.push(child);
      }
    });
    lightsToRemove.forEach(function(light) {
      scene.remove(light);
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
