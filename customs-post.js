window.CustomsPost = (function() {
  'use strict';

  // Game state
  var gameState = {
    smugglersNeutralized: 0,
    contraband: 0,
    officersProtected: 3,
    hudVisible: false,
    keysPressed: [],
    lastKeyTime: 0
  };

  var sceneObjects = [];
  var animatedObjects = [];

  function createRoadSurface(scene) {
    var geometry = new THREE.BoxGeometry(20, 0.5, 80);
    var material = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.position.z = 0;
    scene.add(mesh);
    sceneObjects.push(mesh);
    return mesh;
  }

  function createBoomGate(scene) {
    // Pivot post (cylinder)
    var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 16);
    var postMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(0, 2, 5);
    post.castShadow = true;
    scene.add(post);
    sceneObjects.push(post);

    // Gate arm (thin box)
    var armGeometry = new THREE.BoxGeometry(0.2, 0.3, 8);
    var armMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(0, 3.5, 5);
    arm.castShadow = true;
    scene.add(arm);
    sceneObjects.push(arm);

    animatedObjects.push({
      object: arm,
      type: 'boomGate',
      rotation: 0,
      speed: 1.5
    });

    return { post: post, arm: arm };
  }

  function createCustomsBooth(scene, x, z) {
    // Booth cabin (box)
    var cabinGeometry = new THREE.BoxGeometry(3, 3, 3);
    var cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(x, 1.5, z);
    cabin.castShadow = true;
    scene.add(cabin);
    sceneObjects.push(cabin);

    // Window frame (LineSegments)
    var windowGeometry = new THREE.BufferGeometry();
    var vertices = new Float32Array([
      -1, 0.5, 1.5,   1, 0.5, 1.5,
      1, 0.5, 1.5,    1, 2.5, 1.5,
      1, 2.5, 1.5,    -1, 2.5, 1.5,
      -1, 2.5, 1.5,   -1, 0.5, 1.5
    ]);
    windowGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x0088ff });
    var windowFrame = new THREE.LineSegments(windowGeometry, lineMaterial);
    windowFrame.position.set(x, 0, z);
    scene.add(windowFrame);
    sceneObjects.push(windowFrame);

    return cabin;
  }

  function createInspectionBay(scene) {
    // Shed canopy (box)
    var canopyGeometry = new THREE.BoxGeometry(8, 3, 10);
    var canopyMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(0, 1.5, -15);
    canopy.castShadow = true;
    scene.add(canopy);
    sceneObjects.push(canopy);

    return canopy;
  }

  function createSmugglerVan(scene) {
    var group = new THREE.Group();

    // Van body (box)
    var bodyGeometry = new THREE.BoxGeometry(2.5, 2.5, 6);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.2;
    body.castShadow = true;
    group.add(body);

    // Wheels (cylinders)
    for (var i = 0; i < 4; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(i < 2 ? -1.2 : 1.2, 0.5, (i % 2) * 4 - 2);
      wheel.castShadow = true;
      group.add(wheel);
    }

    group.position.set(-5, 0, 8);
    scene.add(group);
    sceneObjects.push(group);

    animatedObjects.push({
      object: body,
      type: 'vanRock',
      offset: 0,
      speed: 2
    });

    return group;
  }

  function createBorderPatrolSUV(scene) {
    var group = new THREE.Group();

    // SUV body (box)
    var bodyGeometry = new THREE.BoxGeometry(2, 2.2, 5);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x003388 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.1;
    body.castShadow = true;
    group.add(body);

    // Wheels
    for (var i = 0; i < 4; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(i < 2 ? -1 : 1, 0.6, (i % 2) * 4 - 2);
      wheel.castShadow = true;
      group.add(wheel);
    }

    group.position.set(6, 0, 2);
    scene.add(group);
    sceneObjects.push(group);

    return group;
  }

  function createWatchtower(scene) {
    var group = new THREE.Group();

    // 4 cylinder legs
    for (var i = 0; i < 4; i++) {
      var legGeometry = new THREE.CylinderGeometry(0.25, 0.25, 8, 12);
      var legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      var angle = (i / 4) * Math.PI * 2;
      leg.position.set(Math.cos(angle) * 1.5, 4, Math.sin(angle) * 1.5);
      leg.castShadow = true;
      group.add(leg);
    }

    // Cabin on top
    var cabinGeometry = new THREE.BoxGeometry(3, 2.5, 3);
    var cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.y = 9;
    cabin.castShadow = true;
    group.add(cabin);

    group.position.set(-8, 0, -20);
    scene.add(group);
    sceneObjects.push(group);

    return group;
  }

  function createSearchlight(scene) {
    var group = new THREE.Group();

    // Housing (cylinder)
    var housingGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 16);
    var housingMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    var housing = new THREE.Mesh(housingGeometry, housingMaterial);
    housing.castShadow = true;
    group.add(housing);

    // Light sphere (emissive)
    var lightGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    var lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, emissive: 0xffffff });
    var light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.y = 1;
    group.add(light);

    group.position.set(8, 8, -22);
    scene.add(group);
    sceneObjects.push(group);

    animatedObjects.push({
      object: group,
      type: 'searchlight',
      angle: 0,
      speed: 0.8
    });

    return group;
  }

  function createBarbedWireFence(scene) {
    // Left side fence
    var leftGeometry = new THREE.BufferGeometry();
    var leftVertices = new Float32Array([
      -10, 1, -30,  -10, 1, 30,
      -10, 2, -30,  -10, 2, 30
    ]);
    leftGeometry.setAttribute('position', new THREE.BufferAttribute(leftVertices, 3));
    var fenceMaterial = new THREE.LineBasicMaterial({ color: 0x888800, linewidth: 2 });
    var leftFence = new THREE.LineSegments(leftGeometry, fenceMaterial);
    scene.add(leftFence);
    sceneObjects.push(leftFence);

    // Right side fence
    var rightGeometry = new THREE.BufferGeometry();
    var rightVertices = new Float32Array([
      10, 1, -30,   10, 1, 30,
      10, 2, -30,   10, 2, 30
    ]);
    rightGeometry.setAttribute('position', new THREE.BufferAttribute(rightVertices, 3));
    var rightFence = new THREE.LineSegments(rightGeometry, fenceMaterial);
    scene.add(rightFence);
    sceneObjects.push(rightFence);
  }

  function createSmugglerFigures(scene) {
    for (var i = 0; i < 5; i++) {
      var group = new THREE.Group();

      // Body (box)
      var bodyGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.3);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.75;
      body.castShadow = true;
      group.add(body);

      // Head (sphere)
      var headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xaa8866 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.75;
      head.castShadow = true;
      group.add(head);

      var angle = (i / 5) * Math.PI * 2;
      group.position.set(Math.cos(angle) * 3, 0, Math.sin(angle) * 3 + 15);
      scene.add(group);
      sceneObjects.push(group);
    }
  }

  function createBorderOfficers(scene) {
    for (var i = 0; i < 3; i++) {
      var group = new THREE.Group();

      // Body (box)
      var bodyGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.3);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x003366 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.75;
      body.castShadow = true;
      group.add(body);

      // Head (sphere)
      var headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xaa8866 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.75;
      head.castShadow = true;
      group.add(head);

      group.position.set((i - 1) * 3, 0, -8);
      scene.add(group);
      sceneObjects.push(group);

      animatedObjects.push({
        object: group,
        type: 'officerWalk',
        distance: 0,
        speed: 0.5
      });
    }
  }

  function createScanningArch(scene) {
    var group = new THREE.Group();

    // Arch structure (boxes)
    var leftPillarGeometry = new THREE.BoxGeometry(0.3, 4, 0.3);
    var pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var leftPillar = new THREE.Mesh(leftPillarGeometry, pillarMaterial);
    leftPillar.position.set(-2.5, 2, 0);
    leftPillar.castShadow = true;
    group.add(leftPillar);

    var rightPillar = new THREE.Mesh(leftPillarGeometry, pillarMaterial);
    rightPillar.position.set(2.5, 2, 0);
    rightPillar.castShadow = true;
    group.add(rightPillar);

    var topGeometry = new THREE.BoxGeometry(5, 0.3, 0.3);
    var topBar = new THREE.Mesh(topGeometry, pillarMaterial);
    topBar.position.set(0, 4, 0);
    topBar.castShadow = true;
    group.add(topBar);

    // Emissive scanning surface
    var scanGeometry = new THREE.BoxGeometry(4.8, 3.8, 0.1);
    var scanMaterial = new THREE.MeshBasicMaterial({ color: 0x0088ff, emissive: 0x0088ff });
    var scanMesh = new THREE.Mesh(scanGeometry, scanMaterial);
    scanMesh.position.set(0, 2, 0.2);
    group.add(scanMesh);

    group.position.set(0, 0, -35);
    scene.add(group);
    sceneObjects.push(group);

    animatedObjects.push({
      object: scanMesh,
      type: 'scanPulse',
      intensity: 0.5,
      speed: 2
    });

    return group;
  }

  function createContrabandCrates(scene) {
    for (var i = 0; i < 4; i++) {
      var crateGeometry = new THREE.BoxGeometry(1, 1, 1.2);
      var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(-5 + (i % 2) * 0.8, 1.2 + Math.floor(i / 2) * 1, 8 + (i % 2) * 0.5);
      crate.castShadow = true;
      scene.add(crate);
      sceneObjects.push(crate);
    }
  }

  function createBarrierCones(scene) {
    for (var i = 0; i < 6; i++) {
      var coneGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
      var coneMaterial = new THREE.MeshStandardMaterial({ color: 0xff8800 });
      var cone = new THREE.Mesh(coneGeometry, coneMaterial);
      cone.position.set(-3 + i * 1.5, 0.4, 12);
      cone.castShadow = true;
      scene.add(cone);
      sceneObjects.push(cone);
    }
  }

  function createFlagPoles(scene) {
    for (var i = 0; i < 2; i++) {
      var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 6, 12);
      var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set((i - 0.5) * 6, 3, -25);
      pole.castShadow = true;
      scene.add(pole);
      sceneObjects.push(pole);

      var flagGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
      var flagMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
      var flag = new THREE.Mesh(flagGeometry, flagMaterial);
      flag.position.set((i - 0.5) * 6 + 0.8, 5.5, -25);
      flag.castShadow = true;
      scene.add(flag);
      sceneObjects.push(flag);
    }
  }

  function createPassportTerminal(scene) {
    var group = new THREE.Group();

    // Terminal base (box)
    var baseGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.6);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.75;
    base.castShadow = true;
    group.add(base);

    // Screen (emissive box)
    var screenGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.05);
    var screenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, emissive: 0x00ff00 });
    var screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 1.1, 0.35);
    group.add(screen);

    group.position.set(3, 0, -8);
    scene.add(group);
    sceneObjects.push(group);

    return group;
  }

  function createHUD(scene, camera) {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    canvas.style.position = 'absolute';
    canvas.style.top = '10px';
    canvas.style.left = '10px';
    canvas.style.color = '#00ff00';
    canvas.style.fontFamily = 'monospace';
    canvas.style.fontSize = '16px';
    canvas.style.display = 'none';
    canvas.style.zIndex = '100';
    document.body.appendChild(canvas);

    sceneObjects.push(canvas);

    return canvas;
  }

  function updateHUD(canvas) {
    if (!gameState.hudVisible) {
      canvas.style.display = 'none';
      return;
    }
    canvas.style.display = 'block';

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('CUSTOMS CHECKPOINT STATUS', 10, 30);
    ctx.font = '16px monospace';
    ctx.fillText('SMUGGLERS NEUTRALIZED: ' + gameState.smugglersNeutralized + '/5', 10, 60);
    ctx.fillText('CONTRABAND SECURED: ' + gameState.contraband + '/4 CRATES', 10, 90);
    ctx.fillText('OFFICERS PROTECTED: ' + gameState.officersProtected + '/3', 10, 120);
  }

  function setupKeyboardControls() {
    document.addEventListener('keydown', function(e) {
      var now = Date.now();
      var key = e.key.toUpperCase();

      gameState.keysPressed.push(key);

      if (gameState.keysPressed.length > 2) {
        gameState.keysPressed.shift();
      }

      if (gameState.keysPressed.length === 2 &&
          gameState.keysPressed[0] === 'C' &&
          gameState.keysPressed[1] === 'P' &&
          (now - gameState.lastKeyTime) < 400) {
        gameState.hudVisible = !gameState.hudVisible;
        gameState.keysPressed = [];
      }

      gameState.lastKeyTime = now;
    });
  }

  function updateAnimations(delta) {
    for (var i = 0; i < animatedObjects.length; i++) {
      var anim = animatedObjects[i];

      if (anim.type === 'boomGate') {
        anim.rotation += delta * anim.speed;
        anim.object.rotation.x = Math.sin(anim.rotation) * 0.6;
      } else if (anim.type === 'vanRock') {
        anim.offset += delta * anim.speed;
        anim.object.position.y = 1.2 + Math.sin(anim.offset) * 0.1;
      } else if (anim.type === 'searchlight') {
        anim.angle += delta * anim.speed;
        anim.object.rotation.y = anim.angle;
      } else if (anim.type === 'officerWalk') {
        anim.distance += delta * anim.speed;
        anim.object.position.x = ((anim.distance % 10) - 5);
      } else if (anim.type === 'scanPulse') {
        anim.intensity += delta * anim.speed;
        var pulse = 0.3 + Math.sin(anim.intensity) * 0.4;
        anim.object.material.emissiveIntensity = pulse;
      }
    }
  }

  function init(scene, camera) {
    createRoadSurface(scene);
    createBoomGate(scene);
    createCustomsBooth(scene, -6, 0);
    createCustomsBooth(scene, 6, 0);
    createInspectionBay(scene);
    createSmugglerVan(scene);
    createBorderPatrolSUV(scene);
    createWatchtower(scene);
    createSearchlight(scene);
    createBarbedWireFence(scene);
    createSmugglerFigures(scene);
    createBorderOfficers(scene);
    createScanningArch(scene);
    createContrabandCrates(scene);
    createBarrierCones(scene);
    createFlagPoles(scene);
    createPassportTerminal(scene);

    var hud = createHUD(scene, camera);
    setupKeyboardControls();

    return { hud: hud };
  }

  function update(delta) {
    updateAnimations(delta);
    if (sceneObjects.length > 0) {
      var hudCanvas = null;
      for (var i = 0; i < sceneObjects.length; i++) {
        if (sceneObjects[i] instanceof HTMLCanvasElement) {
          hudCanvas = sceneObjects[i];
          break;
        }
      }
      if (hudCanvas) {
        updateHUD(hudCanvas);
      }
    }
  }

  function reset() {
    for (var i = 0; i < sceneObjects.length; i++) {
      var obj = sceneObjects[i];
      if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Group) {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            for (var j = 0; j < obj.material.length; j++) {
              obj.material[j].dispose();
            }
          } else {
            obj.material.dispose();
          }
        }
      } else if (obj instanceof HTMLCanvasElement) {
        obj.remove();
      }
    }
    sceneObjects = [];
    animatedObjects = [];
    gameState = {
      smugglersNeutralized: 0,
      contraband: 0,
      officersProtected: 3,
      hudVisible: false,
      keysPressed: [],
      lastKeyTime: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
