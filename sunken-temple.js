window.SunkenTemple = (function() {
  'use strict';

  var sceneRef, cameraRef;
  var objects = [];
  var time = 0;
  var toggleActive = false;
  var isVisible = true;
  var lastSKeyTime = null;
  var wmdCountdownSeconds = 480;

  var keyStates = {};
  var hudElement = null;

  function init(scene, camera) {
    sceneRef = scene;
    cameraRef = camera;

    scene.fog = new THREE.Fog(0x001a33, 5, 500);
    scene.background = new THREE.Color(0x001a33);

    var ambientLight = new THREE.AmbientLight(0x0044aa, 0.4);
    scene.add(ambientLight);
    objects.push(ambientLight);

    var pointLight1 = new THREE.PointLight(0x00ff88, 0.6, 200);
    pointLight1.position.set(0, 150, -100);
    scene.add(pointLight1);
    objects.push(pointLight1);

    var pointLight2 = new THREE.PointLight(0x0088ff, 0.5, 180);
    pointLight2.position.set(-100, 50, 50);
    scene.add(pointLight2);
    objects.push(pointLight2);

    createSeabed();
    createStepPyramid();
    createTempleGateway();
    createCoralFormations();
    createSubmergedStatue();
    createWMDDevice();
    createKelpForest();
    createSunkenShip();
    createAirBubbleStreams();
    createSubmarineAirlock();
    createCarvedWallPanels();
    createDebrisCloud();
    createBioluminecentFish();
    createPressureDoor();
    createDepthMarkerGauge();
    createEnemyDivers();
    createDefenseTurrets();
    createGuardSubmarine();

    setupHUD();
    setupKeyboardHandling();
  }

  function createSeabed() {
    var seabedGeom = new THREE.BoxGeometry(800, 20, 800);
    var seabedMat = new THREE.MeshPhongMaterial({ color: 0x1a3a1a, emissive: 0x0a1a0a });
    var seabed = new THREE.Mesh(seabedGeom, seabedMat);
    seabed.position.y = -350;
    seabed.receiveShadow = true;
    sceneRef.add(seabed);
    objects.push(seabed);
  }

  function createStepPyramid() {
    var colors = [0x4a6b6b, 0x3a5b5b, 0x2a4b4b, 0x1a3b3b];
    var sizes = [200, 150, 100, 50];
    var positions = [0, 30, 70, 100];

    for (var i = 0; i < 4; i++) {
      var geom = new THREE.BoxGeometry(sizes[i], 40, sizes[i]);
      var mat = new THREE.MeshPhongMaterial({ color: colors[i], emissive: 0x0a1a0a });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(0, -320 + positions[i], 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      sceneRef.add(mesh);
      objects.push(mesh);
    }
  }

  function createTempleGateway() {
    var pillarGeom = new THREE.BoxGeometry(30, 120, 30);
    var pillarMat = new THREE.MeshPhongMaterial({ color: 0x5a6b6b });

    var pillar1 = new THREE.Mesh(pillarGeom, pillarMat);
    pillar1.position.set(-60, -280, 0);
    sceneRef.add(pillar1);
    objects.push(pillar1);

    var pillar2 = new THREE.Mesh(pillarGeom, pillarMat);
    pillar2.position.set(60, -280, 0);
    sceneRef.add(pillar2);
    objects.push(pillar2);

    var lintelGeom = new THREE.BoxGeometry(150, 20, 30);
    var lintelMat = new THREE.MeshPhongMaterial({ color: 0x4a5a5a });
    var lintel = new THREE.Mesh(lintelGeom, lintelMat);
    lintel.position.set(0, -220, 0);
    sceneRef.add(lintel);
    objects.push(lintel);
  }

  function createCoralFormations() {
    var coralColors = [0xff6b35, 0xff8c42, 0xffb347, 0xff6f61];
    var positions = [
      [-150, -320, -100],
      [150, -320, 100],
      [-120, -310, 120],
      [100, -315, -150]
    ];

    for (var i = 0; i < positions.length; i++) {
      var cylGeom = new THREE.CylinderGeometry(15, 20, 60, 8);
      var cylMat = new THREE.MeshPhongMaterial({ color: coralColors[i] });
      var cyl = new THREE.Mesh(cylGeom, cylMat);
      cyl.position.set(positions[i][0], positions[i][1], positions[i][2]);
      sceneRef.add(cyl);
      objects.push(cyl);

      var sphereGeom = new THREE.SphereGeometry(12, 8, 8);
      var sphereMat = new THREE.MeshPhongMaterial({ color: coralColors[i], emissive: coralColors[i], emissiveIntensity: 0.3 });
      var sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(positions[i][0], positions[i][1] + 40, positions[i][2]);
      sceneRef.add(sphere);
      objects.push(sphere);
    }
  }

  function createSubmergedStatue() {
    var torsoGeom = new THREE.CylinderGeometry(20, 25, 80, 8);
    var torsoMat = new THREE.MeshPhongMaterial({ color: 0x6b7b7b });
    var torso = new THREE.Mesh(torsoGeom, torsoMat);
    torso.position.set(200, -300, -150);
    sceneRef.add(torso);
    objects.push(torso);

    var headGeom = new THREE.SphereGeometry(20, 8, 8);
    var headMat = new THREE.MeshPhongMaterial({ color: 0x7a8a8a });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.set(200, -220, -150);
    sceneRef.add(head);
    objects.push(head);
  }

  function createWMDDevice() {
    var wmdGeom = new THREE.SphereGeometry(25, 16, 16);
    var wmdMat = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    window.wmdMesh = new THREE.Mesh(wmdGeom, wmdMat);
    window.wmdMesh.position.set(0, 0, 0);
    sceneRef.add(window.wmdMesh);
    objects.push(window.wmdMesh);

    var cageGeom = new THREE.BoxGeometry(80, 80, 80);
    var cageMat = new THREE.MeshPhongMaterial({ color: 0xaa5544, wireframe: true });
    var cage = new THREE.Mesh(cageGeom, cageMat);
    cage.position.set(0, 0, 0);
    sceneRef.add(cage);
    objects.push(cage);
  }

  function createKelpForest() {
    var kelpPositions = [
      [-200, -340, 0],
      [-150, -340, 50],
      [-100, -340, -50],
      [150, -340, -100],
      [200, -340, 80]
    ];

    window.kelpMeshes = [];
    for (var i = 0; i < kelpPositions.length; i++) {
      var kelpGeom = new THREE.CylinderGeometry(4, 4, 200, 4);
      var kelpMat = new THREE.MeshPhongMaterial({ color: 0x2a6a4a });
      var kelp = new THREE.Mesh(kelpGeom, kelpMat);
      kelp.position.set(kelpPositions[i][0], kelpPositions[i][1] + 100, kelpPositions[i][2]);
      kelp.originalX = kelp.position.x;
      kelp.originalY = kelp.position.y;
      kelp.originalZ = kelp.position.z;
      sceneRef.add(kelp);
      objects.push(kelp);
      window.kelpMeshes.push(kelp);
    }
  }

  function createSunkenShip() {
    var hullGeom = new THREE.BoxGeometry(200, 60, 50);
    var hullMat = new THREE.MeshPhongMaterial({ color: 0x3a3a2a });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(-300, -300, 200);
    sceneRef.add(hull);
    objects.push(hull);

    var mast1Geom = new THREE.CylinderGeometry(8, 8, 150, 8);
    var mastMat = new THREE.MeshPhongMaterial({ color: 0x5a5a4a });
    var mast1 = new THREE.Mesh(mast1Geom, mastMat);
    mast1.position.set(-280, -220, 200);
    sceneRef.add(mast1);
    objects.push(mast1);

    var mast2 = new THREE.Mesh(mast1Geom, mastMat);
    mast2.position.set(-320, -220, 200);
    sceneRef.add(mast2);
    objects.push(mast2);
  }

  function createAirBubbleStreams() {
    window.bubbleSpheres = [];
    var bubbleStartPos = [
      [0, -300, 0],
      [80, -300, 80],
      [-80, -300, -80],
      [120, -300, -120]
    ];

    for (var i = 0; i < bubbleStartPos.length; i++) {
      for (var j = 0; j < 5; j++) {
        var bubbleGeom = new THREE.SphereGeometry(3, 4, 4);
        var bubbleMat = new THREE.MeshPhongMaterial({ color: 0x88ddff, emissive: 0x88ddff, emissiveIntensity: 0.4 });
        var bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
        bubble.position.set(bubbleStartPos[i][0], bubbleStartPos[i][1] + j * 30, bubbleStartPos[i][2]);
        bubble.startY = bubble.position.y;
        sceneRef.add(bubble);
        objects.push(bubble);
        window.bubbleSpheres.push(bubble);
      }
    }
  }

  function createSubmarineAirlock() {
    var airlockGeom = new THREE.CylinderGeometry(40, 40, 60, 16);
    var airlockMat = new THREE.MeshPhongMaterial({ color: 0x4a4a5a });
    var airlock = new THREE.Mesh(airlockGeom, airlockMat);
    airlock.position.set(250, -200, -200);
    sceneRef.add(airlock);
    objects.push(airlock);

    var wheelGeom = new THREE.CylinderGeometry(30, 30, 5, 12);
    var wheelMat = new THREE.MeshPhongMaterial({ color: 0x6a6a7a });
    var wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.position.set(250, -200, -240);
    sceneRef.add(wheel);
    objects.push(wheel);
  }

  function createCarvedWallPanels() {
    var panelPositions = [
      [0, -280, -250],
      [-100, -300, -200],
      [100, -300, -200]
    ];

    for (var i = 0; i < panelPositions.length; i++) {
      var panelGeom = new THREE.BoxGeometry(60, 80, 5);
      var panelMat = new THREE.MeshPhongMaterial({ color: 0x5a6b6b });
      var panel = new THREE.Mesh(panelGeom, panelMat);
      panel.position.set(panelPositions[i][0], panelPositions[i][1], panelPositions[i][2]);
      sceneRef.add(panel);
      objects.push(panel);

      var points = [];
      for (var j = 0; j < 5; j++) {
        points.push(new THREE.Vector3(-20 + j * 10, -30, 0));
      }
      var geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points.flatMap(function(p) { return [p.x, p.y, p.z]; })), 3));
      var lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
      var line = new THREE.LineSegments(geom, lineMat);
      line.position.set(panelPositions[i][0], panelPositions[i][1], panelPositions[i][2]);
      sceneRef.add(line);
      objects.push(line);
    }
  }

  function createDebrisCloud() {
    var debrisPositions = [
      [180, -250, 150],
      [200, -270, 120],
      [220, -230, 180],
      [190, -260, 160],
      [210, -240, 140]
    ];

    for (var i = 0; i < debrisPositions.length; i++) {
      var debrisGeom = new THREE.BoxGeometry(20, 15, 20);
      var debrisMat = new THREE.MeshPhongMaterial({ color: 0x4a5a5a });
      var debris = new THREE.Mesh(debrisGeom, debrisMat);
      debris.position.set(debrisPositions[i][0], debrisPositions[i][1], debrisPositions[i][2]);
      sceneRef.add(debris);
      objects.push(debris);
    }
  }

  function createBioluminecentFish() {
    window.fishMeshes = [];
    var fishPositions = [
      [-150, -200, 0],
      [-120, -180, 50],
      [-180, -210, -30],
      [-140, -190, 20]
    ];

    for (var i = 0; i < fishPositions.length; i++) {
      var fishGeom = new THREE.SphereGeometry(8, 8, 8);
      var fishMat = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.6
      });
      var fish = new THREE.Mesh(fishGeom, fishMat);
      fish.position.set(fishPositions[i][0], fishPositions[i][1], fishPositions[i][2]);
      fish.angle = i * Math.PI / 2;
      fish.radius = 40;
      fish.centerX = fishPositions[i][0];
      fish.centerY = fishPositions[i][1];
      fish.centerZ = fishPositions[i][2];
      sceneRef.add(fish);
      objects.push(fish);
      window.fishMeshes.push(fish);
    }
  }

  function createPressureDoor() {
    var doorGeom = new THREE.BoxGeometry(80, 100, 20);
    var doorMat = new THREE.MeshPhongMaterial({ color: 0x3a4a4a });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(-250, -280, 0);
    sceneRef.add(door);
    objects.push(door);

    var wheelGeom = new THREE.CylinderGeometry(25, 25, 5, 12);
    var wheelMat = new THREE.MeshPhongMaterial({ color: 0x5a6a6a });
    window.doorWheelMesh = new THREE.Mesh(wheelGeom, wheelMat);
    window.doorWheelMesh.position.set(-250, -280, 25);
    sceneRef.add(window.doorWheelMesh);
    objects.push(window.doorWheelMesh);
  }

  function createDepthMarkerGauge() {
    var gaugeGeom = new THREE.CylinderGeometry(12, 12, 120, 8);
    var gaugeMat = new THREE.MeshPhongMaterial({ color: 0x4a5a5a });
    var gauge = new THREE.Mesh(gaugeGeom, gaugeMat);
    gauge.position.set(300, -250, 0);
    sceneRef.add(gauge);
    objects.push(gauge);

    var points = [];
    for (var i = 0; i <= 10; i++) {
      points.push(new THREE.Vector3(0, -50 + i * 10, 0));
    }
    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points.flatMap(function(p) { return [p.x, p.y, p.z]; })), 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    var line = new THREE.LineSegments(geom, lineMat);
    line.position.set(300, -250, 15);
    sceneRef.add(line);
    objects.push(line);
  }

  function createEnemyDivers() {
    var diverPositions = [
      [-200, -200, 0],
      [180, -180, 100],
      [-150, -220, 150]
    ];

    for (var i = 0; i < diverPositions.length; i++) {
      var bodyGeom = new THREE.BoxGeometry(15, 40, 12);
      var bodyMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(diverPositions[i][0], diverPositions[i][1], diverPositions[i][2]);
      sceneRef.add(body);
      objects.push(body);

      var helmetGeom = new THREE.SphereGeometry(12, 8, 8);
      var helmetMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, emissive: 0x0a0a0a });
      var helmet = new THREE.Mesh(helmetGeom, helmetMat);
      helmet.position.set(diverPositions[i][0], diverPositions[i][1] + 35, diverPositions[i][2]);
      sceneRef.add(helmet);
      objects.push(helmet);
    }
  }

  function createDefenseTurrets() {
    var turretPositions = [
      [-180, -270, -180],
      [180, -270, 180],
      [0, -260, 250]
    ];

    for (var i = 0; i < turretPositions.length; i++) {
      var baseGeom = new THREE.CylinderGeometry(20, 20, 15, 8);
      var baseMat = new THREE.MeshPhongMaterial({ color: 0x5a5a5a });
      var base = new THREE.Mesh(baseGeom, baseMat);
      base.position.set(turretPositions[i][0], turretPositions[i][1], turretPositions[i][2]);
      sceneRef.add(base);
      objects.push(base);

      var barrelGeom = new THREE.CylinderGeometry(6, 6, 40, 6);
      var barrelMat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
      var barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.position.set(turretPositions[i][0], turretPositions[i][1] + 30, turretPositions[i][2]);
      sceneRef.add(barrel);
      objects.push(barrel);
    }
  }

  function createGuardSubmarine() {
    var hullGeom = new THREE.BoxGeometry(100, 40, 40);
    var hullMat = new THREE.MeshPhongMaterial({ color: 0x3a3a4a });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(-400, -150, -300);
    sceneRef.add(hull);
    objects.push(hull);

    var conningGeom = new THREE.ConeGeometry(20, 30, 8);
    var conningMat = new THREE.MeshPhongMaterial({ color: 0x4a4a5a });
    var conning = new THREE.Mesh(conningGeom, conningMat);
    conning.position.set(-400, -100, -300);
    sceneRef.add(conning);
    objects.push(conning);

    var propGeom = new THREE.CylinderGeometry(15, 15, 10, 8);
    var propMat = new THREE.MeshPhongMaterial({ color: 0x5a5a6a });
    var prop = new THREE.Mesh(propGeom, propMat);
    prop.position.set(-400, -150, -350);
    sceneRef.add(prop);
    objects.push(prop);
  }

  function setupHUD() {
    hudElement = document.createElement('div');
    hudElement.id = 'sunken-temple-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '10px';
    hudElement.style.left = '10px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '16px';
    hudElement.style.textShadow = '0 0 10px #00ff00';
    hudElement.style.zIndex = '1000';
    hudElement.style.pointerEvents = 'none';
    hudElement.style.display = 'none';
    document.body.appendChild(hudElement);
  }

  function setupKeyboardHandling() {
    document.addEventListener('keydown', function(evt) {
      keyStates[evt.key.toLowerCase()] = true;

      if (evt.key.toLowerCase() === 's') {
        var now = Date.now();
        if (lastSKeyTime !== null && now - lastSKeyTime < 400) {
          if (evt.key.toLowerCase() === 's') {
            lastSKeyTime = null;
          }
        } else {
          lastSKeyTime = now;
          setTimeout(function() {
            lastSKeyTime = null;
          }, 400);
        }
      }

      if (evt.key.toLowerCase() === 't' && lastSKeyTime !== null) {
        var timeDiff = Date.now() - lastSKeyTime;
        if (timeDiff < 400) {
          toggleActive = !toggleActive;
          isVisible = toggleActive;
          if (hudElement) {
            hudElement.style.display = isVisible ? 'block' : 'none';
          }
          lastSKeyTime = null;
        }
      }
    });

    document.addEventListener('keyup', function(evt) {
      keyStates[evt.key.toLowerCase()] = false;
    });
  }

  function updateHUD() {
    if (!hudElement || !isVisible) return;

    var minutes = Math.floor(wmdCountdownSeconds / 60);
    var seconds = wmdCountdownSeconds % 60;
    var timeStr = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

    var hudContent = 'DEPTH: -340m\n';
    hudContent += 'WMD DETONATION: T-' + timeStr + '\n';
    hudContent += 'TEMPLE ZONES CLEARED: 0/4';

    hudElement.textContent = hudContent;
  }

  function update(delta) {
    time += delta;

    if (wmdCountdownSeconds > 0) {
      wmdCountdownSeconds -= delta;
    }

    if (window.wmdMesh) {
      var pulse = 0.5 + 0.5 * Math.sin(time * 3);
      window.wmdMesh.material.emissiveIntensity = pulse * 0.8;
      window.wmdMesh.rotation.x += delta * 0.3;
      window.wmdMesh.rotation.y += delta * 0.5;
    }

    if (window.kelpMeshes) {
      for (var i = 0; i < window.kelpMeshes.length; i++) {
        var kelp = window.kelpMeshes[i];
        var sway = Math.sin(time + i) * 8;
        kelp.position.x = kelp.originalX + sway;
      }
    }

    if (window.bubbleSpheres) {
      for (var i = 0; i < window.bubbleSpheres.length; i++) {
        var bubble = window.bubbleSpheres[i];
        bubble.position.y = bubble.startY + Math.sin(time + i * 0.5) * 20;
      }
    }

    if (window.fishMeshes) {
      for (var i = 0; i < window.fishMeshes.length; i++) {
        var fish = window.fishMeshes[i];
        fish.angle += delta * 0.5;
        fish.position.x = fish.centerX + Math.cos(fish.angle) * fish.radius;
        fish.position.z = fish.centerZ + Math.sin(fish.angle) * fish.radius;
      }
    }

    if (window.doorWheelMesh) {
      window.doorWheelMesh.rotation.z += delta * 2;
    }

    updateHUD();
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      sceneRef.remove(objects[i]);
    }
    objects = [];
    time = 0;
    wmdCountdownSeconds = 480;
    lastSKeyTime = null;
    toggleActive = false;
    isVisible = false;
    keyStates = {};

    if (hudElement) {
      hudElement.style.display = 'none';
    }

    window.wmdMesh = null;
    window.kelpMeshes = [];
    window.bubbleSpheres = [];
    window.fishMeshes = [];
    window.doorWheelMesh = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
