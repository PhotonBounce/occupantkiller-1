window.RacingTrack = (function() {
  'use strict';

  var sceneRef = null;
  var cameraRef = null;
  var sceneObjects = [];
  var enemies = [];
  var bombCars = [];
  var gameState = {
    bombsDisarmed: 0,
    snipersDown: 0,
    circuitSecure: false,
    hudVisible: false
  };
  var keysPressed = {};
  var lastRKeyTime = 0;
  var hudElement = null;
  var animationData = {
    carOrbitAngles: [],
    grandstandSwayTime: 0,
    timingTowerLightIndex: 0,
    tireStackWobbleTime: 0
  };

  var COLOR = {
    red: 0xFF0000,
    white: 0xFFFFFF,
    black: 0x000000,
    tarmac: 0x333333,
    orange: 0xFFA500,
    lightGrey: 0xCCCCCC,
    emeraldGreen: 0x00CC66,
    yellow: 0xFFFF00
  };

  var TRACK_RADIUS = 40;
  var TRACK_WIDTH = 12;
  var PIT_LANE_WIDTH = 6;

  function addToScene(object) {
    sceneRef.add(object);
    sceneObjects.push(object);
  }

  function createTrackSurface() {
    var group = new THREE.Group();
    var outerGeometry = new THREE.CylinderGeometry(TRACK_RADIUS + TRACK_WIDTH / 2, TRACK_RADIUS + TRACK_WIDTH / 2, 0.5, 64);
    var innerGeometry = new THREE.CylinderGeometry(TRACK_RADIUS - TRACK_WIDTH / 2, TRACK_RADIUS - TRACK_WIDTH / 2, 0.5, 64);

    var outerMaterial = new THREE.MeshStandardMaterial({ color: COLOR.tarmac });
    var outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
    group.add(outerMesh);

    var innerGeometry = new THREE.CylinderGeometry(TRACK_RADIUS - TRACK_WIDTH / 2 - 1, TRACK_RADIUS - TRACK_WIDTH / 2 - 1, 0.5, 64);
    var innerMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(innerMesh);

    group.position.y = 0;
    return group;
  }

  function createPitLane() {
    var geometry = new THREE.BoxGeometry(PIT_LANE_WIDTH, 0.3, TRACK_RADIUS * 2 + 20);
    var material = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var pitLane = new THREE.Mesh(geometry, material);
    pitLane.position.set(TRACK_RADIUS + TRACK_WIDTH / 2 + PIT_LANE_WIDTH / 2 + 2, 0.15, 0);
    return pitLane;
  }

  function createGrandstands() {
    var group = new THREE.Group();
    var standPositions = [
      { x: 0, z: -(TRACK_RADIUS + TRACK_WIDTH / 2 + 8) },
      { x: TRACK_RADIUS + TRACK_WIDTH / 2 + 8, z: 0 },
      { x: -(TRACK_RADIUS + TRACK_WIDTH / 2 + 8), z: 0 }
    ];

    standPositions.forEach(function(pos) {
      var standGroup = new THREE.Group();
      for (var i = 0; i < 5; i++) {
        var tier = new THREE.BoxGeometry(25, 3, 4);
        var material = new THREE.MeshStandardMaterial({ color: COLOR.white });
        var tierMesh = new THREE.Mesh(tier, material);
        tierMesh.position.y = i * 3.5;
        standGroup.add(tierMesh);
      }
      standGroup.position.set(pos.x, 0, pos.z);
      group.add(standGroup);
    });

    return group;
  }

  function createPitGarages() {
    var group = new THREE.Group();
    for (var i = 0; i < 4; i++) {
      var geometry = new THREE.BoxGeometry(8, 6, 10);
      var material = new THREE.MeshStandardMaterial({ color: COLOR.black });
      var garage = new THREE.Mesh(geometry, material);
      var xOffset = TRACK_RADIUS + TRACK_WIDTH / 2 + PIT_LANE_WIDTH + 8;
      var zOffset = -20 + i * 12;
      garage.position.set(xOffset, 3, zOffset);
      group.add(garage);
    }
    return group;
  }

  function createTireBarriers() {
    var group = new THREE.Group();
    var positions = [
      { x: TRACK_RADIUS - TRACK_WIDTH / 2 - 3, z: 0 },
      { x: -(TRACK_RADIUS - TRACK_WIDTH / 2 - 3), z: 0 }
    ];

    positions.forEach(function(pos) {
      for (var i = 0; i < 12; i++) {
        var stack = new THREE.Group();
        for (var j = 0; j < 3; j++) {
          var tireGeometry = new THREE.CylinderGeometry(2, 2, 1.2, 32);
          var tireMaterial = new THREE.MeshStandardMaterial({ color: COLOR.black });
          var tire = new THREE.Mesh(tireGeometry, tireMaterial);
          tire.rotation.z = Math.PI / 2;
          tire.position.y = j * 1.3;
          stack.add(tire);
        }
        stack.position.set(pos.x, 0.2, pos.z + (i - 6) * 2.5);
        group.add(stack);
      }
    });

    return group;
  }

  function createSafetyBarriers() {
    var group = new THREE.Group();
    var barrierCount = 24;
    for (var i = 0; i < barrierCount; i++) {
      var angle = (i / barrierCount) * Math.PI * 2;
      var radius = TRACK_RADIUS + TRACK_WIDTH / 2 + 4;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var geometry = new THREE.BoxGeometry(3, 1.5, 0.5);
      var material = new THREE.MeshStandardMaterial({ color: COLOR.red });
      var barrier = new THREE.Mesh(geometry, material);
      barrier.position.set(x, 0.75, z);
      barrier.rotation.y = angle;
      group.add(barrier);
    }
    return group;
  }

  function createFormulaCars() {
    var group = new THREE.Group();
    for (var i = 0; i < 5; i++) {
      var carGroup = new THREE.Group();

      var bodyGeometry = new THREE.BoxGeometry(2.5, 1.2, 5.5);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: COLOR.red });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.z = 0;
      carGroup.add(body);

      var cockpitGeometry = new THREE.BoxGeometry(1.8, 0.8, 1.5);
      var cockpitMaterial = new THREE.MeshStandardMaterial({ color: COLOR.black });
      var cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
      cockpit.position.z = 1.2;
      cockpit.position.y = 0.8;
      carGroup.add(cockpit);

      for (var w = 0; w < 4; w++) {
        var wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
        var wheelMaterial = new THREE.MeshStandardMaterial({ color: COLOR.black });
        var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        var xPos = w < 2 ? -1.5 : 1.5;
        var zPos = w % 2 === 0 ? -1.2 : 1.8;
        wheel.position.set(xPos, 0.3, zPos);
        carGroup.add(wheel);
      }

      carGroup.position.y = 1.5;
      var startAngle = (i / 5) * Math.PI * 2;
      carGroup.userData.orbitAngle = startAngle;
      carGroup.userData.carIndex = i;
      group.add(carGroup);
      bombCars.push(carGroup);
    }
    return group;
  }

  function createStartFinishGantry() {
    var group = new THREE.Group();

    var leftPole = new THREE.BoxGeometry(1, 20, 1);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: COLOR.black });
    var leftPillar = new THREE.Mesh(leftPole, poleMaterial);
    leftPillar.position.set(-15, 10, 35);
    group.add(leftPillar);

    var rightPillar = new THREE.Mesh(leftPole, poleMaterial);
    rightPillar.position.set(15, 10, 35);
    group.add(rightPillar);

    var topBeam = new THREE.BoxGeometry(32, 2, 1);
    var beamMaterial = new THREE.MeshStandardMaterial({ color: COLOR.black });
    var beam = new THREE.Mesh(topBeam, beamMaterial);
    beam.position.set(0, 20, 35);
    group.add(beam);

    var bannerGeometry = new THREE.BoxGeometry(30, 8, 0.1);
    var bannerMaterial = new THREE.MeshStandardMaterial({ color: COLOR.white });
    var banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
    banner.position.set(0, 16, 36);
    group.add(banner);

    return group;
  }

  function createPodium() {
    var group = new THREE.Group();
    var positions = [
      { height: 3, x: 0, size: 6 },
      { height: 2, x: -8, size: 4 },
      { height: 1, x: 8, size: 4 }
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(pos.size, pos.height, pos.size);
      var material = new THREE.MeshStandardMaterial({
        color: pos.x === 0 ? COLOR.red : (pos.x < 0 ? COLOR.lightGrey : COLOR.yellow),
        emissive: pos.x === 0 ? 0x330000 : 0
      });
      var podiumBlock = new THREE.Mesh(geometry, material);
      podiumBlock.position.set(pos.x, pos.height / 2, -50);
      group.add(podiumBlock);
    });

    return group;
  }

  function createTimingTower() {
    var group = new THREE.Group();

    var baseGeometry = new THREE.BoxGeometry(4, 30, 4);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: COLOR.black });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(-60, 15, 0);
    group.add(base);

    for (var i = 0; i < 5; i++) {
      var lightGeometry = new THREE.SphereGeometry(0.8, 16, 16);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: COLOR.red,
        emissive: 0
      });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(-60, 8 + i * 4, 2.5);
      light.userData.lightIndex = i;
      group.add(light);
    }

    group.userData.timingLights = group.children.slice(1);
    return group;
  }

  function createTrackAdvertisements() {
    var group = new THREE.Group();
    var positions = [
      { angle: Math.PI / 4, radius: TRACK_RADIUS + TRACK_WIDTH / 2 + 10 },
      { angle: Math.PI / 2 + Math.PI / 4, radius: TRACK_RADIUS + TRACK_WIDTH / 2 + 10 },
      { angle: Math.PI + Math.PI / 4, radius: TRACK_RADIUS + TRACK_WIDTH / 2 + 10 }
    ];

    positions.forEach(function(pos) {
      var x = Math.cos(pos.angle) * pos.radius;
      var z = Math.sin(pos.angle) * pos.radius;
      var geometry = new THREE.BoxGeometry(8, 5, 0.3);
      var material = new THREE.MeshStandardMaterial({
        color: COLOR.yellow,
        emissive: 0x333300
      });
      var board = new THREE.Mesh(geometry, material);
      board.position.set(x, 3, z);
      board.rotation.y = pos.angle + Math.PI / 2;
      group.add(board);
    });

    return group;
  }

  function createMarshalPosts() {
    var group = new THREE.Group();
    var postCount = 8;
    for (var i = 0; i < postCount; i++) {
      var angle = (i / postCount) * Math.PI * 2;
      var radius = TRACK_RADIUS - TRACK_WIDTH / 2 - 6;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var geometry = new THREE.BoxGeometry(2, 3, 2);
      var material = new THREE.MeshStandardMaterial({ color: COLOR.orange });
      var post = new THREE.Mesh(geometry, material);
      post.position.set(x, 1.5, z);
      group.add(post);
    }
    return group;
  }

  function createSafetyCar() {
    var group = new THREE.Group();

    var bodyGeometry = new THREE.BoxGeometry(2.2, 1.1, 4.8);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: COLOR.yellow });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    for (var w = 0; w < 4; w++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: COLOR.black });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      var xPos = w < 2 ? -1.3 : 1.3;
      var zPos = w % 2 === 0 ? -1.1 : 1.6;
      wheel.position.set(xPos, 0.25, zPos);
      group.add(wheel);
    }

    group.position.set(55, 1.2, 0);
    return group;
  }

  function createTireStackChicane() {
    var group = new THREE.Group();
    for (var i = 0; i < 3; i++) {
      var stackGroup = new THREE.Group();
      for (var j = 0; j < 4; j++) {
        var tireGeometry = new THREE.CylinderGeometry(2, 2, 1.2, 32);
        var tireMaterial = new THREE.MeshStandardMaterial({ color: COLOR.black });
        var tire = new THREE.Mesh(tireGeometry, tireMaterial);
        tire.rotation.z = Math.PI / 2;
        tire.position.y = j * 1.3;
        stackGroup.add(tire);
      }
      stackGroup.position.set(-30 + i * 8, 0.2, 45);
      stackGroup.userData.chicaneIndex = i;
      group.add(stackGroup);
    }
    return group;
  }

  function createOverheadCameraGantry() {
    var group = new THREE.Group();

    var leftSupport = new THREE.BoxGeometry(1, 12, 1);
    var supportMaterial = new THREE.MeshStandardMaterial({ color: COLOR.black });
    var leftSupp = new THREE.Mesh(leftSupport, supportMaterial);
    leftSupp.position.set(-20, 6, 30);
    group.add(leftSupp);

    var rightSupp = new THREE.Mesh(leftSupport, supportMaterial);
    rightSupp.position.set(20, 6, 30);
    group.add(rightSupp);

    var beam = new THREE.BoxGeometry(42, 1, 1);
    var beamMaterial = new THREE.MeshStandardMaterial({ color: COLOR.lightGrey });
    var topBeam = new THREE.Mesh(beam, beamMaterial);
    topBeam.position.set(0, 12, 30);
    group.add(topBeam);

    var cameraBox = new THREE.BoxGeometry(1, 1.5, 2);
    var cameraMaterial = new THREE.MeshStandardMaterial({ color: COLOR.black });
    var camera = new THREE.Mesh(cameraBox, cameraMaterial);
    camera.position.set(0, 12, 32);
    group.add(camera);

    return group;
  }

  function createEnemies() {
    var group = new THREE.Group();

    for (var i = 0; i < 3; i++) {
      var sniper = createEnemyFigure();
      sniper.position.set(-65 - i * 5, 8 + i * 3, 10);
      sniper.userData.type = 'sniper';
      sniper.userData.health = 1;
      group.add(sniper);
      enemies.push(sniper);
    }

    for (var i = 0; i < 4; i++) {
      var pitCrew = createEnemyFigure();
      var xPos = TRACK_RADIUS + TRACK_WIDTH / 2 + PIT_LANE_WIDTH + 15;
      pitCrew.position.set(xPos, 1, -15 + i * 10);
      pitCrew.userData.type = 'pit_crew';
      pitCrew.userData.health = 1;
      group.add(pitCrew);
      enemies.push(pitCrew);
    }

    return group;
  }

  function createEnemyFigure() {
    var group = new THREE.Group();

    var bodyGeometry = new THREE.BoxGeometry(0.6, 1.8, 0.4);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333399 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    group.add(body);

    var headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    var headMaterial = new THREE.MeshStandardMaterial({ color: COLOR.black });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.95;
    group.add(head);

    for (var i = 0; i < 2; i++) {
      var armGeometry = new THREE.BoxGeometry(0.25, 1.2, 0.25);
      var armMaterial = new THREE.MeshStandardMaterial({ color: COLOR.lightGrey });
      var arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.x = i === 0 ? -0.4 : 0.4;
      arm.position.y = 1.2;
      group.add(arm);
    }

    for (var i = 0; i < 2; i++) {
      var legGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
      var legMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.x = i === 0 ? -0.2 : 0.2;
      leg.position.y = 0.3;
      group.add(leg);
    }

    return group;
  }

  function updateHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'racing-track-hud';
      hudElement.style.cssText = 'position: fixed; top: 10px; left: 10px; color: #fff; font-family: monospace; font-size: 14px; background: rgba(0,0,0,0.7); padding: 10px; border: 2px solid #f00; display: none; z-index: 100;';
      document.body.appendChild(hudElement);
    }

    if (gameState.hudVisible) {
      hudElement.innerHTML = 'CAR BOMBS DISARMED: ' + gameState.bombsDisarmed + '/5<br>' +
                             'SNIPERS DOWN: ' + gameState.snipersDown + '<br>' +
                             'CIRCUIT SECURE: ' + (gameState.circuitSecure ? 'YES' : 'NO');
      hudElement.style.display = 'block';
    } else {
      hudElement.style.display = 'none';
    }
  }

  function handleKeyDown(event) {
    keysPressed[event.key] = true;

    if (event.key === 'r' || event.key === 'R') {
      var currentTime = Date.now();
      if (currentTime - lastRKeyTime > 400) {
        lastRKeyTime = currentTime;
      }
    }

    if ((event.key === 't' || event.key === 'T') && Date.now() - lastRKeyTime < 400) {
      gameState.hudVisible = !gameState.hudVisible;
      updateHUD();
      lastRKeyTime = 0;
    }
  }

  function handleKeyUp(event) {
    keysPressed[event.key] = false;
  }

  function animateBombCars(delta) {
    bombCars.forEach(function(car) {
      var orbitSpeed = 0.5;
      car.userData.orbitAngle += orbitSpeed * delta;

      var x = Math.cos(car.userData.orbitAngle) * (TRACK_RADIUS - 2);
      var z = Math.sin(car.userData.orbitAngle) * (TRACK_RADIUS - 2);
      car.position.set(x, 1.5, z);
      car.rotation.y = car.userData.orbitAngle + Math.PI / 2;

      var distance = cameraRef.position.distanceTo(car.position);
      if (distance < 15) {
        bombCars.forEach(function(c) {
          if (c.children && c.children[0]) {
            c.children[0].material.emissive.setHex(0x660000);
            c.children[0].material.emissiveIntensity = 0.5;
          }
        });
      }
    });
  }

  function animateGrandstands(delta) {
    animationData.grandstandSwayTime += delta;
    var sway = Math.sin(animationData.grandstandSwayTime * 0.5) * 0.05;

    sceneObjects.forEach(function(obj) {
      if (obj.children && obj.children[0] && obj.children[0].geometry && obj.children[0].geometry.type === 'BoxGeometry') {
        if (Math.abs(obj.position.x) > 30 && Math.abs(obj.position.z) < 5) {
          obj.rotation.z = sway;
        }
      }
    });
  }

  function animateTimingTower(delta) {
    animationData.timingTowerLightIndex = Math.floor(animationData.grandstandSwayTime * 2) % 5;

    sceneObjects.forEach(function(obj) {
      if (obj.userData.timingLights) {
        obj.userData.timingLights.forEach(function(light, idx) {
          if (idx === animationData.timingTowerLightIndex) {
            light.material.emissive.setHex(0xFF0000);
            light.material.emissiveIntensity = 0.8;
          } else {
            light.material.emissive.setHex(0);
            light.material.emissiveIntensity = 0;
          }
        });
      }
    });
  }

  function animateTireStacks(delta) {
    animationData.tireStackWobbleTime += delta;
    var wobble = Math.sin(animationData.tireStackWobbleTime * 3) * 0.03;

    sceneObjects.forEach(function(obj) {
      if (obj.userData.chicaneIndex !== undefined) {
        obj.rotation.z = wobble;
      }
    });
  }

  function init(scene, camera) {
    sceneRef = scene;
    cameraRef = camera;

    scene.fog = new THREE.Fog(0x87CEEB, 200, 500);
    scene.background = new THREE.Color(0x87CEEB);

    var light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(50, 80, 50);
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var trackSurface = createTrackSurface();
    addToScene(trackSurface);

    var pitLane = createPitLane();
    addToScene(pitLane);

    var grandstands = createGrandstands();
    addToScene(grandstands);

    var garages = createPitGarages();
    addToScene(garages);

    var tireBarriers = createTireBarriers();
    addToScene(tireBarriers);

    var safetyBarriers = createSafetyBarriers();
    addToScene(safetyBarriers);

    var cars = createFormulaCars();
    addToScene(cars);

    var gantry = createStartFinishGantry();
    addToScene(gantry);

    var podium = createPodium();
    addToScene(podium);

    var tower = createTimingTower();
    addToScene(tower);

    var ads = createTrackAdvertisements();
    addToScene(ads);

    var marshals = createMarshalPosts();
    addToScene(marshals);

    var safetyCar = createSafetyCar();
    addToScene(safetyCar);

    var chicane = createTireStackChicane();
    addToScene(chicane);

    var cameraGantry = createOverheadCameraGantry();
    addToScene(cameraGantry);

    var enemyGroup = createEnemies();
    addToScene(enemyGroup);

    updateHUD();

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  }

  function update(delta) {
    animateBombCars(delta);
    animateGrandstands(delta);
    animateTimingTower(delta);
    animateTireStacks(delta);
    updateHUD();
  }

  function reset() {
    sceneObjects.forEach(function(obj) {
      sceneRef.remove(obj);
    });
    sceneObjects = [];
    enemies = [];
    bombCars = [];
    gameState = {
      bombsDisarmed: 0,
      snipersDown: 0,
      circuitSecure: false,
      hudVisible: false
    };

    if (hudElement) {
      hudElement.style.display = 'none';
    }

    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
