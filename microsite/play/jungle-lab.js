window.JungleLab = (function() {
  'use strict';

  var scene, camera;
  var gameState = {
    bioweaponsDestroyed: 0,
    dataDrivesSecured: 0,
    scientistsExtracted: 0,
    hudVisible: false,
    lastKeyTime: 0,
    jPressed: false
  };

  var allObjects = [];
  var allGeometries = [];
  var allMaterials = [];
  var scientists = [];
  var guards = [];
  var tanks = [];
  var bubbles = [];

  function createMaterial(color, emissive, metalness, roughness) {
    emissive = emissive || 0x000000;
    metalness = metalness || 0.3;
    roughness = roughness || 0.7;
    var material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive,
      metalness: metalness,
      roughness: roughness
    });
    allMaterials.push(material);
    return material;
  }

  function createGeometry(geometry) {
    allGeometries.push(geometry);
    return geometry;
  }

  function addObject(obj) {
    scene.add(obj);
    allObjects.push(obj);
    return obj;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    // Setup lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    addObject(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    addObject(directionalLight);

    // 1. Jungle floor clearing (large flat box, deep green)
    var floorGeom = createGeometry(new THREE.BoxGeometry(400, 2, 400));
    var floorMat = createMaterial(0x1a4d1a, 0x000000, 0.2, 0.8);
    var floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -1;
    floor.receiveShadow = true;
    addObject(floor);

    // 2. Main lab prefab building (box with LineSegments window grate)
    var mainLabGeom = createGeometry(new THREE.BoxGeometry(60, 40, 50));
    var mainLabMat = createMaterial(0x404040, 0x000000, 0.5, 0.6);
    var mainLab = new THREE.Mesh(mainLabGeom, mainLabMat);
    mainLab.position.set(0, 20, 0);
    mainLab.castShadow = true;
    mainLab.receiveShadow = true;
    addObject(mainLab);

    // Window grate on main lab
    var windowLines = [];
    for (var i = -25; i <= 25; i += 10) {
      windowLines.push(new THREE.Vector3(i, 15, 25.5));
      windowLines.push(new THREE.Vector3(i, 35, 25.5));
    }
    for (var j = 15; j <= 35; j += 5) {
      windowLines.push(new THREE.Vector3(-25, j, 25.5));
      windowLines.push(new THREE.Vector3(25, j, 25.5));
    }
    var windowGeom = createGeometry(new THREE.BufferGeometry().setFromPoints(windowLines));
    var lineMat = new THREE.LineBasicMaterial({ color: 0x0066cc });
    allMaterials.push(lineMat);
    var windowGrate = new THREE.LineSegments(windowGeom, lineMat);
    addObject(windowGrate);

    // 3. Secondary containment unit (smaller box, airlocks = LineSegments seals)
    var containerGeom = createGeometry(new THREE.BoxGeometry(40, 35, 30));
    var containerMat = createMaterial(0x333333, 0x000000, 0.6, 0.5);
    var container = new THREE.Mesh(containerGeom, containerMat);
    container.position.set(-80, 17.5, -60);
    container.castShadow = true;
    container.receiveShadow = true;
    addObject(container);

    // Airlock seals
    var airlockLines = [];
    var sealPositions = [-20, -10, 0, 10, 20];
    for (var k = 0; k < sealPositions.length; k++) {
      airlockLines.push(new THREE.Vector3(sealPositions[k], 5, -15.5));
      airlockLines.push(new THREE.Vector3(sealPositions[k], 30, -15.5));
    }
    var airlockGeom = createGeometry(new THREE.BufferGeometry().setFromPoints(airlockLines));
    var airlockMat = new THREE.LineBasicMaterial({ color: 0xff6600 });
    allMaterials.push(airlockMat);
    var airlockSeals = new THREE.LineSegments(airlockGeom, airlockMat);
    airlockSeals.position.set(-80, 0, -60);
    addObject(airlockSeals);

    // 4. Tall jungle trees (cylinder trunk + cone canopy, 8 around perimeter)
    var treePositions = [
      [-150, 0, -150],
      [150, 0, -150],
      [-150, 0, 150],
      [150, 0, 150],
      [-180, 0, 0],
      [180, 0, 0],
      [0, 0, -180],
      [0, 0, 180]
    ];

    for (var t = 0; t < treePositions.length; t++) {
      // Trunk
      var trunkGeom = createGeometry(new THREE.CylinderGeometry(4, 6, 60, 8));
      var trunkMat = createMaterial(0x4d3319, 0x000000, 0.4, 0.8);
      var trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.set(treePositions[t][0], 30, treePositions[t][2]);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      addObject(trunk);

      // Canopy
      var canopyGeom = createGeometry(new THREE.ConeGeometry(20, 50, 8));
      var canopyMat = createMaterial(0x2d5016, 0x000000, 0.2, 0.9);
      var canopy = new THREE.Mesh(canopyGeom, canopyMat);
      canopy.position.set(treePositions[t][0], 65, treePositions[t][2]);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      addObject(canopy);
    }

    // 5. Biohazard specimen tanks (cylinder glass tanks with green emissive liquid)
    var tankPositions = [
      [60, 0, 20],
      [60, 0, -40],
      [-60, 0, 20],
      [-60, 0, -40]
    ];

    for (var tn = 0; tn < tankPositions.length; tn++) {
      var tankGeom = createGeometry(new THREE.CylinderGeometry(12, 12, 40, 12));
      var tankMat = createMaterial(0x0a2d0a, 0x00ff00, 0.9, 0.1);
      var tank = new THREE.Mesh(tankGeom, tankMat);
      tank.position.set(tankPositions[tn][0], 20, tankPositions[tn][1]);
      tank.castShadow = true;
      tank.receiveShadow = true;
      addObject(tank);
      tanks.push(tank);

      // Tank rim
      var rimGeom = createGeometry(new THREE.CylinderGeometry(12, 12, 2, 12));
      var rimMat = createMaterial(0x1a1a1a, 0x000000, 0.8, 0.3);
      var rim = new THREE.Mesh(rimGeom, rimMat);
      rim.position.set(tankPositions[tn][0], 40.5, tankPositions[tn][1]);
      rim.castShadow = true;
      addObject(rim);
    }

    // 6. Research equipment bench (box benches with box equipment items)
    var benchGeom = createGeometry(new THREE.BoxGeometry(50, 3, 20));
    var benchMat = createMaterial(0x666666, 0x000000, 0.5, 0.6);
    var bench = new THREE.Mesh(benchGeom, benchMat);
    bench.position.set(40, 15, -100);
    bench.castShadow = true;
    bench.receiveShadow = true;
    addObject(bench);

    // Equipment items on bench
    for (var eq = 0; eq < 5; eq++) {
      var equipGeom = createGeometry(new THREE.BoxGeometry(6, 8, 4));
      var equipMat = createMaterial(0xcccccc, 0x0088ff, 0.7, 0.3);
      var equip = new THREE.Mesh(equipGeom, equipMat);
      equip.position.set(40 - 20 + eq * 10, 20, -100);
      equip.castShadow = true;
      addObject(equip);
    }

    // 7. Helicopter landing pad (octagonal: use cylinder, flat, with LineSegments markings)
    var padGeom = createGeometry(new THREE.CylinderGeometry(35, 35, 1, 8));
    var padMat = createMaterial(0x333333, 0x000000, 0.4, 0.7);
    var pad = new THREE.Mesh(padGeom, padMat);
    pad.position.set(120, 0.5, 120);
    pad.receiveShadow = true;
    addObject(pad);

    // Pad markings
    var markingLines = [];
    for (var m = 0; m < 8; m++) {
      var angle1 = (m * Math.PI * 2) / 8;
      var angle2 = ((m + 1) * Math.PI * 2) / 8;
      markingLines.push(new THREE.Vector3(Math.cos(angle1) * 35, 1, Math.sin(angle1) * 35));
      markingLines.push(new THREE.Vector3(Math.cos(angle2) * 35, 1, Math.sin(angle2) * 35));
      markingLines.push(new THREE.Vector3(0, 1, 0));
      markingLines.push(new THREE.Vector3(Math.cos(angle1) * 25, 1, Math.sin(angle1) * 25));
    }
    var markingGeom = createGeometry(new THREE.BufferGeometry().setFromPoints(markingLines));
    var markingMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
    allMaterials.push(markingMat);
    var markings = new THREE.LineSegments(markingGeom, markingMat);
    markings.position.set(120, 0.6, 120);
    addObject(markings);

    // 8. Jungle path guard post (box sandbag shelter)
    var postGeom = createGeometry(new THREE.BoxGeometry(30, 15, 25));
    var postMat = createMaterial(0x8b7355, 0x000000, 0.3, 0.8);
    var post = new THREE.Mesh(postGeom, postMat);
    post.position.set(-120, 7.5, 100);
    post.castShadow = true;
    post.receiveShadow = true;
    addObject(post);

    // 9. Power generator (box with cylinder exhaust pipes)
    var genGeom = createGeometry(new THREE.BoxGeometry(25, 20, 25));
    var genMat = createMaterial(0x404040, 0x000000, 0.6, 0.5);
    var gen = new THREE.Mesh(genGeom, genMat);
    gen.position.set(100, 10, -100);
    gen.castShadow = true;
    gen.receiveShadow = true;
    addObject(gen);

    // Exhaust pipes
    for (var p = 0; p < 2; p++) {
      var pipeGeom = createGeometry(new THREE.CylinderGeometry(3, 3, 20, 6));
      var pipeMat = createMaterial(0x1a1a1a, 0x000000, 0.7, 0.3);
      var pipe = new THREE.Mesh(pipeGeom, pipeMat);
      pipe.position.set(100 - 8 + p * 16, 30, -100);
      pipe.castShadow = true;
      addObject(pipe);
    }

    // 10. Solar panel array (flat box panels on cylinder frame)
    var frameGeom = createGeometry(new THREE.CylinderGeometry(2, 2, 50, 4));
    var frameMat = createMaterial(0x333333, 0x000000, 0.7, 0.4);
    var frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(-100, 25, 100);
    frame.castShadow = true;
    addObject(frame);

    // Panels
    for (var pn = 0; pn < 4; pn++) {
      var panelGeom = createGeometry(new THREE.BoxGeometry(20, 20, 1));
      var panelMat = createMaterial(0x1a1a3d, 0x0033ff, 0.9, 0.2);
      var panel = new THREE.Mesh(panelGeom, panelMat);
      panel.position.set(-100 - 15 + pn * 10, 40, 100);
      panel.castShadow = true;
      addObject(panel);
    }

    // 11. Satellite dish (cylinder mount + flat box dish)
    var dishMountGeom = createGeometry(new THREE.CylinderGeometry(4, 6, 15, 6));
    var dishMountMat = createMaterial(0x666666, 0x000000, 0.6, 0.5);
    var dishMount = new THREE.Mesh(dishMountGeom, dishMountMat);
    dishMount.position.set(0, 15, 150);
    dishMount.castShadow = true;
    addObject(dishMount);

    var dishGeom = createGeometry(new THREE.BoxGeometry(25, 2, 25));
    var dishMat = createMaterial(0xcccccc, 0x000000, 0.8, 0.3);
    var dish = new THREE.Mesh(dishGeom, dishMat);
    dish.position.set(0, 32, 150);
    dish.rotation.x = 0.5;
    dish.castShadow = true;
    addObject(dish);

    // 12. Chain-link fence perimeter (LineSegments posts + wire)
    var fencePosts = [
      [-180, 0, -180],
      [180, 0, -180],
      [180, 0, 180],
      [-180, 0, 180]
    ];

    for (var fp = 0; fp < fencePosts.length; fp++) {
      var postGeom = createGeometry(new THREE.CylinderGeometry(2, 2, 25, 6));
      var postMat = createMaterial(0x333333, 0x000000, 0.5, 0.6);
      var fencePost = new THREE.Mesh(postGeom, postMat);
      fencePost.position.set(fencePosts[fp][0], 12.5, fencePosts[fp][2]);
      fencePost.castShadow = true;
      addObject(fencePost);
    }

    // Fence wires
    var fenceLines = [];
    for (var fw = 0; fw < 5; fw++) {
      fenceLines.push(new THREE.Vector3(-180, fw * 5, -180));
      fenceLines.push(new THREE.Vector3(180, fw * 5, -180));
      fenceLines.push(new THREE.Vector3(180, fw * 5, -180));
      fenceLines.push(new THREE.Vector3(180, fw * 5, 180));
      fenceLines.push(new THREE.Vector3(180, fw * 5, 180));
      fenceLines.push(new THREE.Vector3(-180, fw * 5, 180));
      fenceLines.push(new THREE.Vector3(-180, fw * 5, 180));
      fenceLines.push(new THREE.Vector3(-180, fw * 5, -180));
    }
    var fenceGeom = createGeometry(new THREE.BufferGeometry().setFromPoints(fenceLines));
    var fenceMat = new THREE.LineBasicMaterial({ color: 0x666666 });
    allMaterials.push(fenceMat);
    var fence = new THREE.LineSegments(fenceGeom, fenceMat);
    addObject(fence);

    // 13. Lab scientist figures (white box coats, 4 scientists)
    var scientistPositions = [
      [-40, 0, -30],
      [-30, 0, -40],
      [20, 0, -50],
      [35, 0, -25]
    ];

    for (var sc = 0; sc < scientistPositions.length; sc++) {
      // Body
      var bodyGeom = createGeometry(new THREE.BoxGeometry(6, 14, 4));
      var bodyMat = createMaterial(0xf0f0f0, 0x000000, 0.3, 0.8);
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(scientistPositions[sc][0], 7, scientistPositions[sc][1]);
      body.castShadow = true;
      addObject(body);
      scientists.push(body);

      // Head
      var headGeom = createGeometry(new THREE.SphereGeometry(3, 8, 8));
      var headMat = createMaterial(0xffccaa, 0x000000, 0.2, 0.8);
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.set(scientistPositions[sc][0], 17, scientistPositions[sc][1]);
      head.castShadow = true;
      addObject(head);
    }

    // 14. Armed cartel guard figures (camo box clothes, 5 guards)
    var guardPositions = [
      [-150, 0, 80],
      [150, 0, 80],
      [0, 0, -150],
      [-120, 0, -120],
      [120, 0, 120]
    ];

    for (var gd = 0; gd < guardPositions.length; gd++) {
      // Body
      var guardBodyGeom = createGeometry(new THREE.BoxGeometry(6, 16, 4));
      var guardBodyMat = createMaterial(0x333300, 0x000000, 0.4, 0.7);
      var guardBody = new THREE.Mesh(guardBodyGeom, guardBodyMat);
      guardBody.position.set(guardPositions[gd][0], 8, guardPositions[gd][1]);
      guardBody.castShadow = true;
      addObject(guardBody);
      guards.push(guardBody);

      // Head
      var guardHeadGeom = createGeometry(new THREE.SphereGeometry(3, 8, 8));
      var guardHeadMat = createMaterial(0xffccaa, 0x000000, 0.2, 0.8);
      var guardHead = new THREE.Mesh(guardHeadGeom, guardHeadMat);
      guardHead.position.set(guardPositions[gd][0], 18, guardPositions[gd][1]);
      guardHead.castShadow = true;
      addObject(guardHead);
    }

    // 15. Biohazard barrel dump (cylinder barrels stacked, 6)
    var barrelPositions = [
      [70, 0, 80],
      [85, 0, 85],
      [75, 15, 75],
      [90, 15, 80],
      [80, 30, 85],
      [85, 30, 75]
    ];

    for (var br = 0; br < barrelPositions.length; br++) {
      var barrelGeom = createGeometry(new THREE.CylinderGeometry(5, 5, 15, 8));
      var barrelMat = createMaterial(0xff6600, 0xffaa00, 0.6, 0.4);
      var barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.position.set(barrelPositions[br][0], barrelPositions[br][1] + 7.5, barrelPositions[br][2]);
      barrel.castShadow = true;
      addObject(barrel);
    }

    // 16. Specimen cage (LineSegments cage box)
    var cageLines = [];
    var cageSize = 15;
    var cageX = -40, cageY = 0, cageZ = 60;

    // Front face
    cageLines.push(new THREE.Vector3(cageX - cageSize, cageY, cageZ));
    cageLines.push(new THREE.Vector3(cageX + cageSize, cageY, cageZ));
    cageLines.push(new THREE.Vector3(cageX + cageSize, cageY, cageZ));
    cageLines.push(new THREE.Vector3(cageX + cageSize, cageY + cageSize * 1.5, cageZ));
    cageLines.push(new THREE.Vector3(cageX + cageSize, cageY + cageSize * 1.5, cageZ));
    cageLines.push(new THREE.Vector3(cageX - cageSize, cageY + cageSize * 1.5, cageZ));
    cageLines.push(new THREE.Vector3(cageX - cageSize, cageY + cageSize * 1.5, cageZ));
    cageLines.push(new THREE.Vector3(cageX - cageSize, cageY, cageZ));

    // Back face
    cageLines.push(new THREE.Vector3(cageX - cageSize, cageY, cageZ - cageSize));
    cageLines.push(new THREE.Vector3(cageX + cageSize, cageY, cageZ - cageSize));
    cageLines.push(new THREE.Vector3(cageX + cageSize, cageY, cageZ - cageSize));
    cageLines.push(new THREE.Vector3(cageX + cageSize, cageY + cageSize * 1.5, cageZ - cageSize));
    cageLines.push(new THREE.Vector3(cageX + cageSize, cageY + cageSize * 1.5, cageZ - cageSize));
    cageLines.push(new THREE.Vector3(cageX - cageSize, cageY + cageSize * 1.5, cageZ - cageSize));
    cageLines.push(new THREE.Vector3(cageX - cageSize, cageY + cageSize * 1.5, cageZ - cageSize));
    cageLines.push(new THREE.Vector3(cageX - cageSize, cageY, cageZ - cageSize));

    // Vertical edges
    cageLines.push(new THREE.Vector3(cageX - cageSize, cageY, cageZ));
    cageLines.push(new THREE.Vector3(cageX - cageSize, cageY, cageZ - cageSize));
    cageLines.push(new THREE.Vector3(cageX + cageSize, cageY, cageZ));
    cageLines.push(new THREE.Vector3(cageX + cageSize, cageY, cageZ - cageSize));

    var cageGeom = createGeometry(new THREE.BufferGeometry().setFromPoints(cageLines));
    var cageMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    allMaterials.push(cageMat);
    var cage = new THREE.LineSegments(cageGeom, cageMat);
    addObject(cage);

    // 17. Chemical runoff trench (flat dark box channel)
    var trenchGeom = createGeometry(new THREE.BoxGeometry(80, 2, 6));
    var trenchMat = createMaterial(0x1a1a1a, 0x000000, 0.2, 0.9);
    var trench = new THREE.Mesh(trenchGeom, trenchMat);
    trench.position.set(0, 1, -120);
    trench.receiveShadow = true;
    addObject(trench);

    // Setup keyboard listener for HUD toggle (J+L combo)
    document.addEventListener('keydown', function(e) {
      if (e.key.toLowerCase() === 'j') {
        gameState.jPressed = true;
        gameState.lastKeyTime = Date.now();
      }
      if (e.key.toLowerCase() === 'l' && gameState.jPressed) {
        if (Date.now() - gameState.lastKeyTime < 400) {
          gameState.hudVisible = !gameState.hudVisible;
        }
        gameState.jPressed = false;
      }
    });

    document.addEventListener('keyup', function(e) {
      if (e.key.toLowerCase() === 'j') {
        if (Date.now() - gameState.lastKeyTime > 400) {
          gameState.jPressed = false;
        }
      }
    });
  }

  function update(delta) {
    // Animate specimen tank liquid bubbles
    for (var t = 0; t < tanks.length; t++) {
      if (!tanks[t].bubbleArray) {
        tanks[t].bubbleArray = [];
        for (var b = 0; b < 3; b++) {
          var bubbleGeom = createGeometry(new THREE.SphereGeometry(1.5, 6, 6));
          var bubbleMat = createMaterial(0x00ff00, 0x00ff00, 0.8, 0.2);
          var bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
          bubble.position.copy(tanks[t].position);
          bubble.position.y = tanks[t].position.y - 15;
          addObject(bubble);
          tanks[t].bubbleArray.push({
            mesh: bubble,
            speed: 10 + Math.random() * 5,
            offsetX: (Math.random() - 0.5) * 8
          });
        }
      }

      for (var bb = 0; bb < tanks[t].bubbleArray.length; bb++) {
        var b = tanks[t].bubbleArray[bb];
        b.mesh.position.y += b.speed * delta;
        b.mesh.position.x = tanks[t].position.x + b.offsetX + Math.sin(Date.now() * 0.001 + bb) * 3;

        if (b.mesh.position.y > tanks[t].position.y + 25) {
          b.mesh.position.y = tanks[t].position.y - 15;
        }
      }
    }

    // Tree swaying
    var treeIndex = 0;
    for (var tr = 0; tr < allObjects.length; tr++) {
      if (allObjects[tr].geometry && allObjects[tr].geometry.type === 'ConeGeometry') {
        var swayAngle = Math.sin(Date.now() * 0.0005 + treeIndex) * 0.05;
        allObjects[tr].rotation.z = swayAngle;
        treeIndex++;
      }
    }

    // Guard patrol movement
    for (var gd = 0; gd < guards.length; gd++) {
      guards[gd].position.x += Math.sin(Date.now() * 0.0003 + gd * 100) * 0.5;
      guards[gd].position.z += Math.cos(Date.now() * 0.0003 + gd * 100) * 0.5;
    }

    // Update HUD overlay
    updateHUD();
  }

  function updateHUD() {
    var hudElement = document.getElementById('jungleLabHUD');
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'jungleLabHUD';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#00ff00';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '14px';
      hudElement.style.zIndex = '1000';
      hudElement.style.textShadow = '0 0 10px #00ff00';
      document.body.appendChild(hudElement);
    }

    if (gameState.hudVisible) {
      hudElement.innerHTML = 'BIOWEAPONS DESTROYED: ' + gameState.bioweaponsDestroyed + '/4<br/>' +
                             'DATA DRIVES SECURED: ' + gameState.dataDrivesSecured + '/3<br/>' +
                             'SCIENTISTS EXTRACTED: ' + gameState.scientistsExtracted + '/4';
      hudElement.style.display = 'block';
    } else {
      hudElement.style.display = 'none';
    }
  }

  function reset() {
    // Remove all objects from scene
    for (var i = allObjects.length - 1; i >= 0; i--) {
      scene.remove(allObjects[i]);
    }
    allObjects = [];

    // Dispose geometries
    for (var g = 0; g < allGeometries.length; g++) {
      allGeometries[g].dispose();
    }
    allGeometries = [];

    // Dispose materials
    for (var m = 0; m < allMaterials.length; m++) {
      allMaterials[m].dispose();
    }
    allMaterials = [];

    // Reset game state
    gameState = {
      bioweaponsDestroyed: 0,
      dataDrivesSecured: 0,
      scientistsExtracted: 0,
      hudVisible: false,
      lastKeyTime: 0,
      jPressed: false
    };

    scientists = [];
    guards = [];
    tanks = [];
    bubbles = [];

    // Hide HUD
    var hudElement = document.getElementById('jungleLabHUD');
    if (hudElement) {
      hudElement.style.display = 'none';
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
