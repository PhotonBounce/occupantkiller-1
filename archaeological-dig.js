window.ArchaeologicalDig = (function() {
  'use strict';

  // State
  var scene, camera;
  var sceneObjects = [];
  var keyPressTime = {};
  var keybindActive = false;
  var artifactSecured = false;
  var siteIntegrity = 100;
  var enemyCount = 4;
  var gameTime = 0;

  // Animation references
  var artifactSphere = null;
  var generatorLight = null;
  var floodlightArray = [];
  var ropeMarkers = [];
  var helicopterLight = null;

  // Initialize scene
  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    sceneObjects = [];

    // Set fog - dusty desert atmosphere
    scene.fog = new THREE.Fog(0xd4a574, 20, 100);
    scene.background = new THREE.Color(0xd4a574);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xf5deb3, 0.6);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xfff8dc, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
    sceneObjects.push(directionalLight);

    // Main excavation pit - deep cut into ground
    var pitGeometry = new THREE.BoxGeometry(40, 8, 40);
    var pitMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    var pitMesh = new THREE.Mesh(pitGeometry, pitMaterial);
    pitMesh.position.y = -4;
    scene.add(pitMesh);
    sceneObjects.push(pitMesh);

    // Scaffolding grid over pit - LineSegments framework
    var scaffoldGeometry = new THREE.BufferGeometry();
    var scaffoldPoints = [];
    var gridSize = 40;
    var gridDivisionsPerSide = 5;
    var spacing = gridSize / gridDivisionsPerSide;
    for (var i = 0; i <= gridDivisionsPerSide; i++) {
      var pos = -gridSize / 2 + i * spacing;
      // X-axis lines
      scaffoldPoints.push(pos, 3, -gridSize / 2);
      scaffoldPoints.push(pos, 3, gridSize / 2);
      // Z-axis lines
      scaffoldPoints.push(-gridSize / 2, 3, pos);
      scaffoldPoints.push(gridSize / 2, 3, pos);
    }
    scaffoldGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(scaffoldPoints), 3));
    var scaffoldMaterial = new THREE.LineBasicMaterial({ color: 0x8b4513 });
    var scaffoldLines = new THREE.LineSegments(scaffoldGeometry, scaffoldMaterial);
    scene.add(scaffoldLines);
    sceneObjects.push(scaffoldLines);

    // Excavation tents - box structures with angled roof
    var createTent = function(x, z) {
      var tentBody = new THREE.Mesh(
        new THREE.BoxGeometry(6, 4, 6),
        new THREE.MeshStandardMaterial({ color: 0xd2b48c })
      );
      tentBody.position.set(x, 2, z);
      scene.add(tentBody);
      sceneObjects.push(tentBody);

      var roofGeometry = new THREE.BoxGeometry(7, 0.5, 6);
      var roofMaterial = new THREE.MeshStandardMaterial({ color: 0xa0826d });
      var roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(x, 4.5, z);
      roof.rotation.z = Math.PI / 6;
      scene.add(roof);
      sceneObjects.push(roof);
    };
    createTent(-15, -15);
    createTent(15, -15);
    createTent(-15, 15);

    // Ancient column fragments - cylinder stumps
    var createColumn = function(x, z, height) {
      var columnGeometry = new THREE.CylinderGeometry(0.8, 0.8, height, 16);
      var columnMaterial = new THREE.MeshStandardMaterial({ color: 0xa89968 });
      var column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.set(x, height / 2 - 4, z);
      scene.add(column);
      sceneObjects.push(column);
    };
    createColumn(-8, -5, 1.5);
    createColumn(5, -8, 2);
    createColumn(10, 8, 1.2);

    // Artifact pedestal - ornate box stand with glowing artifact sphere
    var pedestalBase = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 3),
      new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    pedestalBase.position.y = -2;
    scene.add(pedestalBase);
    sceneObjects.push(pedestalBase);

    var pedestalTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.5, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x9d8863 })
    );
    pedestalTop.position.y = -0.75;
    scene.add(pedestalTop);
    sceneObjects.push(pedestalTop);

    var artifactGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    var artifactMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffa500,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.2
    });
    artifactSphere = new THREE.Mesh(artifactGeometry, artifactMaterial);
    artifactSphere.position.y = 0.5;
    scene.add(artifactSphere);
    sceneObjects.push(artifactSphere);

    // Wooden boardwalk paths - flat box strips
    var createBoardwalk = function(x, z, width, depth) {
      var boardGeometry = new THREE.BoxGeometry(width, 0.3, depth);
      var boardMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      var board = new THREE.Mesh(boardGeometry, boardMaterial);
      board.position.set(x, -3.85, z);
      scene.add(board);
      sceneObjects.push(board);
    };
    createBoardwalk(0, -18, 8, 4);
    createBoardwalk(-18, 0, 4, 8);
    createBoardwalk(18, 0, 4, 8);

    // Sifting screen station - box frame with LineSegments mesh
    var screenFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.3, 4),
      new THREE.MeshStandardMaterial({ color: 0x696969 })
    );
    screenFrame.position.set(-12, 3, 12);
    scene.add(screenFrame);
    sceneObjects.push(screenFrame);

    var screenMeshGeometry = new THREE.BufferGeometry();
    var screenPoints = [];
    for (var sx = 0; sx <= 8; sx++) {
      screenPoints.push(-2 + sx * 0.5, 3.5, 12);
      screenPoints.push(-2 + sx * 0.5, 3.5, 12.05);
    }
    for (var sz = 0; sz <= 8; sz++) {
      screenPoints.push(-2, 3.5, 12 + sz * 0.5);
      screenPoints.push(-2.05, 3.5, 12 + sz * 0.5);
    }
    screenMeshGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(screenPoints), 3));
    var screenMeshMaterial = new THREE.LineBasicMaterial({ color: 0x505050 });
    var screenMeshLines = new THREE.LineSegments(screenMeshGeometry, screenMeshMaterial);
    scene.add(screenMeshLines);
    sceneObjects.push(screenMeshLines);

    // Generator trailer - box
    var generatorGeometry = new THREE.BoxGeometry(4, 2, 3);
    var generatorMaterial = new THREE.MeshStandardMaterial({ color: 0xdc143c });
    var generator = new THREE.Mesh(generatorGeometry, generatorMaterial);
    generator.position.set(15, 1, 18);
    scene.add(generator);
    sceneObjects.push(generator);

    var generatorLightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    var generatorLightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      emissive: 0xff8c00,
      emissiveIntensity: 0.8
    });
    generatorLight = new THREE.Mesh(generatorLightGeometry, generatorLightMaterial);
    generatorLight.position.set(15, 2.3, 18);
    scene.add(generatorLight);
    sceneObjects.push(generatorLight);

    // Floodlight towers - tall cylinder poles + box lamp heads
    var createFloodlight = function(x, z) {
      var poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
      var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x2f4f4f });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(x, 4, z);
      scene.add(pole);
      sceneObjects.push(pole);

      var lampGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
      var lampMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff99,
        emissive: 0xffff00,
        emissiveIntensity: 0.7
      });
      var lamp = new THREE.Mesh(lampGeometry, lampMaterial);
      lamp.position.set(x, 8.5, z);
      scene.add(lamp);
      sceneObjects.push(lamp);
      floodlightArray.push(lamp);
    };
    createFloodlight(-20, -20);
    createFloodlight(20, -20);
    createFloodlight(-20, 20);

    // Wheelbarrow - box body + sphere wheel
    var wheelbarrowGeometry = new THREE.BoxGeometry(2, 1, 1.5);
    var wheelbarrowMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    var wheelbarrow = new THREE.Mesh(wheelbarrowGeometry, wheelbarrowMaterial);
    wheelbarrow.position.set(12, 0.5, -12);
    scene.add(wheelbarrow);
    sceneObjects.push(wheelbarrow);

    var wheelGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(12, 0.6, -13.2);
    scene.add(wheel);
    sceneObjects.push(wheel);

    // Archaeological grid rope markers - LineSegments in pit
    var ropeGeometry = new THREE.BufferGeometry();
    var ropePoints = [];
    for (var ry = 0; ry <= 4; ry++) {
      var ropeY = -3 + ry * 1;
      ropePoints.push(-18, ropeY, -18);
      ropePoints.push(18, ropeY, -18);
      ropePoints.push(-18, ropeY, 18);
      ropePoints.push(18, ropeY, 18);
    }
    ropeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePoints), 3));
    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0xdaa520 });
    var ropeMarkerLines = new THREE.LineSegments(ropeGeometry, ropeMaterial);
    ropeMarkers.push(ropeMarkerLines);
    scene.add(ropeMarkerLines);
    sceneObjects.push(ropeMarkerLines);

    // Ancient wall section revealed - stone-colored box panel
    var wallGeometry = new THREE.BoxGeometry(8, 4, 0.5);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0xa89968 });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, -1, -19);
    scene.add(wall);
    sceneObjects.push(wall);

    // Artifact storage crates - stacked boxes
    var createCrate = function(x, y, z) {
      var crateGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(x, y, z);
      scene.add(crate);
      sceneObjects.push(crate);
    };
    createCrate(-18, 0, -15);
    createCrate(-18, 1.75, -15);
    createCrate(-16.5, 0, -15);
    createCrate(-16.5, 1.75, -15);

    // Portable toilet units - box
    var toiletGeometry = new THREE.BoxGeometry(1, 2.5, 1);
    var toiletMaterial = new THREE.MeshStandardMaterial({ color: 0x4169e1 });
    var toilet = new THREE.Mesh(toiletGeometry, toiletMaterial);
    toilet.position.set(18, 1.25, -18);
    scene.add(toilet);
    sceneObjects.push(toilet);

    // Dig site perimeter fence - LineSegments + cylinder posts
    var fenceGeometry = new THREE.BufferGeometry();
    var fencePoints = [];
    var fenceRadius = 25;
    for (var fp = 0; fp < 16; fp++) {
      var angle1 = (fp / 16) * Math.PI * 2;
      var angle2 = ((fp + 1) / 16) * Math.PI * 2;
      var x1 = Math.cos(angle1) * fenceRadius;
      var z1 = Math.sin(angle1) * fenceRadius;
      var x2 = Math.cos(angle2) * fenceRadius;
      var z2 = Math.sin(angle2) * fenceRadius;
      fencePoints.push(x1, 0.5, z1);
      fencePoints.push(x2, 0.5, z2);
    }
    fenceGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fencePoints), 3));
    var fenceMaterial = new THREE.LineBasicMaterial({ color: 0x556b2f });
    var fenceLines = new THREE.LineSegments(fenceGeometry, fenceMaterial);
    scene.add(fenceLines);
    sceneObjects.push(fenceLines);

    var createFencePost = function(angle) {
      var x = Math.cos(angle) * fenceRadius;
      var z = Math.sin(angle) * fenceRadius;
      var postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
      var postMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(x, 0.75, z);
      scene.add(post);
      sceneObjects.push(post);
    };
    for (var fpi = 0; fpi < 16; fpi++) {
      createFencePost((fpi / 16) * Math.PI * 2);
    }

    // Helicopter searchlight - animated sweeping light from above
    var helicopterLightGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    var helicopterLightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5
    });
    helicopterLight = new THREE.Mesh(helicopterLightGeometry, helicopterLightMaterial);
    helicopterLight.position.set(0, 20, 0);
    scene.add(helicopterLight);
    sceneObjects.push(helicopterLight);

    // Setup keybinding listener
    document.addEventListener('keydown', handleKeyDown);
  }

  // Handle A+D keybind
  function handleKeyDown(event) {
    var key = event.key.toUpperCase();
    var now = Date.now();

    if (key === 'A') {
      keyPressTime.a = now;
    } else if (key === 'D') {
      if (keyPressTime.a && (now - keyPressTime.a) < 400) {
        keybindActive = !keybindActive;
        showHudNotification(keybindActive ? 'HUD: ON' : 'HUD: OFF');
        keyPressTime.a = null;
      }
    }

    // Clear old timestamps
    if (now - (keyPressTime.a || 0) > 500) {
      keyPressTime.a = null;
    }
  }

  function showHudNotification(message) {
    if (typeof console !== 'undefined') {
      console.log(message);
    }
  }

  // Update animation loop
  function update(delta) {
    gameTime += delta;

    if (!scene || !camera) return;

    // Artifact pulses and glows
    if (artifactSphere) {
      var pulseIntensity = 0.3 + Math.sin(gameTime * 3) * 0.3;
      artifactSphere.material.emissiveIntensity = pulseIntensity;
      artifactSphere.rotation.y += 0.005;
      artifactSphere.scale.set(
        1 + Math.sin(gameTime * 2) * 0.05,
        1 + Math.sin(gameTime * 2) * 0.05,
        1 + Math.sin(gameTime * 2) * 0.05
      );
    }

    // Generator light flickers
    if (generatorLight) {
      var flicker = Math.random() > 0.7 ? 0.3 : 0.8;
      generatorLight.material.emissiveIntensity = flicker;
    }

    // Floodlights illuminate pit with intensity variation
    for (var fi = 0; fi < floodlightArray.length; fi++) {
      var floodlight = floodlightArray[fi];
      var intensity = 0.5 + Math.sin(gameTime * 1.5 + fi) * 0.3;
      floodlight.material.emissiveIntensity = intensity;
    }

    // Rope markers sway slightly
    if (ropeMarkers.length > 0) {
      var sway = Math.sin(gameTime * 0.8) * 0.02;
      ropeMarkers[0].position.x = sway;
    }

    // Helicopter searchlight sweeps from above
    if (helicopterLight) {
      var sweepAngle = (gameTime * 0.5) % (Math.PI * 2);
      helicopterLight.position.x = Math.cos(sweepAngle) * 15;
      helicopterLight.position.z = Math.sin(sweepAngle) * 15;
    }
  }

  // Reset scene
  function reset() {
    document.removeEventListener('keydown', handleKeyDown);

    for (var i = 0; i < sceneObjects.length; i++) {
      if (sceneObjects[i]) {
        scene.remove(sceneObjects[i]);
      }
    }
    sceneObjects = [];
    floodlightArray = [];
    ropeMarkers = [];

    artifactSphere = null;
    generatorLight = null;
    helicopterLight = null;
    keybindActive = false;
    artifactSecured = false;
    siteIntegrity = 100;
    enemyCount = 4;
    gameTime = 0;
    keyPressTime = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
