window.SpaceElevator = (function() {
  'use strict';

  var scene, camera;
  var allObjects = [];
  var gameState = {
    altitude: 0,
    boardersRepelled: 0,
    cableIntegrity: 100,
    elevatorY: 0,
    time: 0,
    keyState: {}
  };
  var lastSKeyTime = 0;
  var sKeyWasPressed = false;
  var isActive = false;
  var hudElement = null;
  var enemies = [];
  var elevatorGroup = null;
  var cameraMode = 'hud';

  function createElevatorCabin() {
    var cabinGeom = new THREE.BoxGeometry(8, 12, 8);
    var cabinMat = new THREE.MeshStandardMaterial({ color: 0x1a4d7a, metalness: 0.6, roughness: 0.4 });
    var cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.y = 50;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    scene.add(cabin);
    allObjects.push(cabin);

    // Windows on cabin
    var windowGeom = new THREE.BoxGeometry(1.5, 1.5, 0.2);
    var windowMat = new THREE.MeshStandardMaterial({ color: 0x4da6ff, metalness: 0.8, roughness: 0.1, emissive: 0x1a4d7a });
    var posX = [-3, 3];
    var posY = [-2, 2];
    for (var i = 0; i < posX.length; i++) {
      for (var j = 0; j < posY.length; j++) {
        var window1 = new THREE.Mesh(windowGeom, windowMat);
        window1.position.set(posX[i], posY[j], 4.1);
        cabin.add(window1);
      }
    }
    for (var i = 0; i < posX.length; i++) {
      for (var j = 0; j < posY.length; j++) {
        var window2 = new THREE.Mesh(windowGeom, windowMat);
        window2.position.set(posX[i], posY[j], -4.1);
        cabin.add(window2);
      }
    }

    // Solar panels
    var panelGeom = new THREE.BoxGeometry(12, 0.3, 6);
    var panelMat = new THREE.MeshStandardMaterial({ color: 0x2d5f8d, metalness: 0.7, roughness: 0.3 });
    var panelTop = new THREE.Mesh(panelGeom, panelMat);
    panelTop.position.y = 6.5;
    cabin.add(panelTop);

    var panelBot = new THREE.Mesh(panelGeom, panelMat);
    panelBot.position.y = -6.5;
    cabin.add(panelBot);

    return cabin;
  }

  function createTetherCable() {
    var cableGeom = new THREE.CylinderGeometry(0.15, 0.15, 1000, 8);
    var cableMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
    var cable = new THREE.Mesh(cableGeom, cableMat);
    cable.position.y = 500;
    cable.castShadow = true;
    cable.receiveShadow = true;
    scene.add(cable);
    allObjects.push(cable);
    return cable;
  }

  function createCounterweight() {
    var weightGeom = new THREE.BoxGeometry(20, 30, 20);
    var weightMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5, roughness: 0.5 });
    var weight = new THREE.Mesh(weightGeom, weightMat);
    weight.position.y = 1200;
    weight.castShadow = true;
    weight.receiveShadow = true;
    scene.add(weight);
    allObjects.push(weight);
    return weight;
  }

  function createPulleys() {
    var pulleyGeom = new THREE.CylinderGeometry(4, 4, 2, 32);
    var pulleyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.1 });

    // Bottom pulley
    var pulleyBot = new THREE.Mesh(pulleyGeom, pulleyMat);
    pulleyBot.position.set(0, 0, 0);
    pulleyBot.rotation.z = Math.PI / 2;
    pulleyBot.castShadow = true;
    pulleyBot.receiveShadow = true;
    scene.add(pulleyBot);
    allObjects.push(pulleyBot);

    // Top pulley
    var pulleyTop = new THREE.Mesh(pulleyGeom, pulleyMat);
    pulleyTop.position.set(0, 1000, 0);
    pulleyTop.rotation.z = Math.PI / 2;
    pulleyTop.castShadow = true;
    pulleyTop.receiveShadow = true;
    scene.add(pulleyTop);
    allObjects.push(pulleyTop);

    return { bottom: pulleyBot, top: pulleyTop };
  }

  function createCloudLayer() {
    var clouds = [];
    for (var i = 0; i < 8; i++) {
      var cloudGeom = new THREE.BoxGeometry(60, 2, 40);
      var cloudMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        emissive: 0x666666,
        metalness: 0.1,
        roughness: 0.8
      });
      var cloud = new THREE.Mesh(cloudGeom, cloudMat);
      cloud.position.set((i - 4) * 70, 50 + (i % 3) * 15, -i * 100);
      cloud.castShadow = true;
      cloud.receiveShadow = true;
      scene.add(cloud);
      allObjects.push(cloud);
      clouds.push(cloud);
    }
    return clouds;
  }

  function createEarthCurve() {
    var earthGeom = new THREE.SphereGeometry(400, 32, 32);
    var earthMat = new THREE.MeshStandardMaterial({
      color: 0x1a5c2d,
      metalness: 0.1,
      roughness: 0.8
    });
    var earth = new THREE.Mesh(earthGeom, earthMat);
    earth.position.y = -350;
    earth.castShadow = true;
    earth.receiveShadow = true;
    scene.add(earth);
    allObjects.push(earth);
    return earth;
  }

  function createStars() {
    var starsGeom = new THREE.BufferGeometry();
    var starPositions = [];
    for (var i = 0; i < 200; i++) {
      var x = (Math.random() - 0.5) * 2000;
      var y = Math.random() * 2000;
      var z = (Math.random() - 0.5) * 2000;
      starPositions.push(x, y, z);
    }
    starsGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(starPositions), 3));
    var starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: true });
    var stars = new THREE.Points(starsGeom, starMat);
    scene.add(stars);
    allObjects.push(stars);
    return stars;
  }

  function createEnemy() {
    var bodyGeom = new THREE.BoxGeometry(1.5, 2.5, 0.8);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x4d0000, metalness: 0.4, roughness: 0.6 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);

    var headGeom = new THREE.SphereGeometry(0.6, 16, 16);
    var headMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, metalness: 0.2, roughness: 0.8 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.8;
    body.add(head);

    var bootGeom = new THREE.BoxGeometry(0.5, 0.8, 0.6);
    var bootMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2, emissive: 0xff0000 });
    var bootL = new THREE.Mesh(bootGeom, bootMat);
    bootL.position.set(-0.5, -1.2, 0);
    body.add(bootL);
    var bootR = new THREE.Mesh(bootGeom, bootMat);
    bootR.position.set(0.5, -1.2, 0);
    body.add(bootR);

    var sideX = Math.random() > 0.5 ? 1 : -1;
    var sideZ = -5 - Math.random() * 3;
    body.position.set(sideX * 6, 50 + (Math.random() - 0.5) * 10, sideZ);
    body.velocity = { x: -sideX * 0.5, y: 0, z: 1 };
    body.health = 1;
    body.castShadow = true;
    body.receiveShadow = true;

    scene.add(body);
    allObjects.push(body);
    enemies.push(body);

    return body;
  }

  function updateHUD() {
    if (hudElement) {
      var altKm = Math.floor(gameState.altitude / 10);
      hudElement.innerHTML = 'ALTITUDE: ' + altKm + ' km | BOARDERS REPELLED: ' + gameState.boardersRepelled + '/5 | CABLE INTEGRITY: ' + Math.floor(gameState.cableIntegrity) + '%';
    }
  }

  function handleKeyDown(e) {
    gameState.keyState[e.code] = true;

    if (e.code === 'KeyS') {
      var now = Date.now();
      if (now - lastSKeyTime < 400) {
        if (!sKeyWasPressed) {
          sKeyWasPressed = true;
          lastSKeyTime = 0;
        }
      } else {
        lastSKeyTime = now;
        sKeyWasPressed = false;
      }
    }

    if (e.code === 'KeyE' && sKeyWasPressed) {
      isActive = !isActive;
      if (hudElement) {
        if (isActive) {
          hudElement.style.display = 'block';
        } else {
          hudElement.style.display = 'none';
        }
      }
      sKeyWasPressed = false;
      lastSKeyTime = 0;
    }
  }

  function handleKeyUp(e) {
    gameState.keyState[e.code] = false;
  }

  function handleMouseClick(e) {
    if (!isActive) return;

    var mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(enemies);

    if (intersects.length > 0) {
      var enemy = intersects[0].object;
      enemy.health -= 0.5;
      if (enemy.health <= 0) {
        gameState.boardersRepelled++;
        scene.remove(enemy);
        var idx = enemies.indexOf(enemy);
        if (idx > -1) {
          enemies.splice(idx, 1);
        }
        var objIdx = allObjects.indexOf(enemy);
        if (objIdx > -1) {
          allObjects.splice(objIdx, 1);
        }
      }
    }
  }

  function update(delta) {
    if (!isActive) return;

    gameState.time += delta;
    gameState.altitude += delta * 15;
    gameState.elevatorY = gameState.altitude / 10;

    // Move elevator cabin up
    if (elevatorGroup) {
      elevatorGroup.position.y = 50 + gameState.elevatorY;
    }

    // Update clouds drifting
    var cloudLayer = scene.children.filter(function(obj) {
      return obj.geometry && obj.geometry instanceof THREE.BoxGeometry && obj.position.y > 30 && obj.position.y < 100 && obj.position.z < -50;
    });
    cloudLayer.forEach(function(cloud, idx) {
      cloud.position.z += delta * 20;
      if (cloud.position.z > 200) {
        cloud.position.z = -1000;
      }
    });

    // Update enemies
    var spawnChance = 0.02;
    if (Math.random() < spawnChance && enemies.length < 5) {
      createEnemy();
    }

    enemies.forEach(function(enemy) {
      enemy.position.x += enemy.velocity.x;
      enemy.position.z += enemy.velocity.z;

      // Magnetic attraction to cabin
      if (elevatorGroup) {
        var dx = elevatorGroup.position.x - enemy.position.x;
        var dz = elevatorGroup.position.z - enemy.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.1) {
          enemy.velocity.x += (dx / dist) * delta * 2;
          enemy.velocity.z += (dz / dist) * delta * 2;
        }

        // Damage cable if enemies reach cabin
        if (dist < 5) {
          gameState.cableIntegrity -= delta * 5;
        }
      }

      enemy.rotation.y += delta * 0.5;
    });

    // Update lighting based on altitude
    var skyColor = new THREE.Color();
    var altRatio = Math.min(gameState.altitude / 1000, 1);
    skyColor.lerpColors(new THREE.Color(0x87ceeb), new THREE.Color(0x000033), altRatio);
    scene.background = skyColor;

    if (scene.fog) {
      scene.fog.far = 500 + altRatio * 500;
    }

    updateHUD();
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    allObjects.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    allObjects.push(directionalLight);

    // Setup fog
    scene.fog = new THREE.Fog(0x87ceeb, 400, 1000);

    // Create elevator group
    elevatorGroup = new THREE.Group();
    scene.add(elevatorGroup);
    allObjects.push(elevatorGroup);

    // Create main objects
    var cabin = createElevatorCabin();
    var cable = createTetherCable();
    var weight = createCounterweight();
    var pulleys = createPulleys();
    var clouds = createCloudLayer();
    var earth = createEarthCurve();
    var stars = createStars();

    // Create HUD
    hudElement = document.createElement('div');
    hudElement.id = 'space-elevator-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '2px solid #00ff00';
    hudElement.style.display = 'none';
    hudElement.style.zIndex = '1000';
    document.body.appendChild(hudElement);

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('click', handleMouseClick);

    updateHUD();
  }

  function reset() {
    gameState.altitude = 0;
    gameState.boardersRepelled = 0;
    gameState.cableIntegrity = 100;
    gameState.elevatorY = 0;
    gameState.time = 0;
    enemies = [];

    // Remove all objects
    for (var i = allObjects.length - 1; i >= 0; i--) {
      var obj = allObjects[i];
      if (obj.parent && obj.parent !== scene) {
        obj.parent.remove(obj);
      } else if (scene && scene.children.indexOf(obj) !== -1) {
        scene.remove(obj);
      }
    }
    allObjects = [];

    if (elevatorGroup) {
      scene.remove(elevatorGroup);
      elevatorGroup = null;
    }

    if (hudElement) {
      hudElement.style.display = 'none';
    }

    isActive = false;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
