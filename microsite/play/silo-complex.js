window.SiloComplex = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var silos = [];
  var launchMissile = null;
  var gantries = [];
  var guards = [];
  var animationTime = 0;

  function buildSilo(x, z, isLaunching) {
    var cylinderGeometry = new THREE.CylinderGeometry(12, 14, 80, 16);
    var cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
    var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.set(x, 0, z);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    scene.add(cylinder);

    var rimGeometry = new THREE.CylinderGeometry(14, 14, 2, 16);
    var rimMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(x, 40, z);
    rim.castShadow = true;
    scene.add(rim);

    if (isLaunching) {
      var missileGeometry = new THREE.ConeGeometry(2.5, 35, 8);
      var missileMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
      var missile = new THREE.Mesh(missileGeometry, missileMaterial);
      missile.position.set(x, 50, z);
      missile.castShadow = true;
      scene.add(missile);
      launchMissile = { mesh: missile, baseY: 50, targetY: 120, active: false };
    }

    silos.push({ x: x, z: z, mesh: cylinder });
  }

  function buildGantry(x, z) {
    var baseGeometry = new THREE.BoxGeometry(8, 3, 25);
    var steelMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7 });
    var base = new THREE.Mesh(baseGeometry, steelMaterial);
    base.position.set(x, 1.5, z);
    base.castShadow = true;
    scene.add(base);

    var leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1, 30, 2), steelMaterial);
    leftPillar.position.set(x - 3.5, 15, z);
    leftPillar.castShadow = true;
    scene.add(leftPillar);

    var rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1, 30, 2), steelMaterial);
    rightPillar.position.set(x + 3.5, 15, z);
    rightPillar.castShadow = true;
    scene.add(rightPillar);

    var topBeam = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 2), steelMaterial);
    topBeam.position.set(x, 30, z);
    topBeam.castShadow = true;
    scene.add(topBeam);

    gantries.push({ x: x, z: z });
  }

  function buildControlCenter() {
    var buildingGeometry = new THREE.BoxGeometry(25, 15, 20);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
    var building = new THREE.Mesh(buildingGeometry, concreteMaterial);
    building.position.set(0, 7.5, -50);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);

    var roofGeometry = new THREE.ConeGeometry(14, 8, 4);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 19.5, -50);
    roof.castShadow = true;
    scene.add(roof);
  }

  function buildPerimeterFence() {
    var fenceLength = 150;
    var fenceGeometry = new THREE.BoxGeometry(0.5, 6, fenceLength);
    var fenceMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5 });

    var northFence = new THREE.Mesh(fenceGeometry, fenceMaterial);
    northFence.position.set(0, 3, 75);
    northFence.castShadow = true;
    scene.add(northFence);

    var southFence = new THREE.Mesh(fenceGeometry, fenceMaterial);
    southFence.position.set(0, 3, -75);
    southFence.castShadow = true;
    scene.add(southFence);

    var eastGeometry = new THREE.BoxGeometry(fenceLength, 6, 0.5);
    var eastFence = new THREE.Mesh(eastGeometry, fenceMaterial);
    eastFence.position.set(75, 3, 0);
    eastFence.castShadow = true;
    scene.add(eastFence);

    var westFence = new THREE.Mesh(eastGeometry, fenceMaterial);
    westFence.position.set(-75, 3, 0);
    westFence.castShadow = true;
    scene.add(westFence);
  }

  function buildGuardTower(x, z) {
    var baseGeometry = new THREE.CylinderGeometry(4, 5, 2, 8);
    var steelMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });
    var base = new THREE.Mesh(baseGeometry, steelMaterial);
    base.position.set(x, 1, z);
    base.castShadow = true;
    scene.add(base);

    var poleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 25, 6);
    var pole = new THREE.Mesh(poleGeometry, steelMaterial);
    pole.position.set(x, 13, z);
    pole.castShadow = true;
    scene.add(pole);

    var cabinGeometry = new THREE.BoxGeometry(5, 4, 5);
    var cabin = new THREE.Mesh(cabinGeometry, new THREE.MeshStandardMaterial({ color: 0x333333 }));
    cabin.position.set(x, 27, z);
    cabin.castShadow = true;
    scene.add(cabin);

    guards.push({ x: x, z: z, angle: 0 });
  }

  function buildBlastDeflector(x, z) {
    var wallGeometry = new THREE.BoxGeometry(40, 3, 2);
    var steelMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.8 });
    var wall = new THREE.Mesh(wallGeometry, steelMaterial);
    wall.position.set(x, 2, z);
    wall.castShadow = true;
    scene.add(wall);

    var channelGeometry = new THREE.BoxGeometry(38, 4, 15);
    var channelMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var channel = new THREE.Mesh(channelGeometry, channelMaterial);
    channel.position.set(x, 1, z - 8);
    channel.castShadow = true;
    scene.add(channel);
  }

  function buildDecontaminationUnit(x, z) {
    var buildingGeometry = new THREE.BoxGeometry(12, 12, 10);
    var tileMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.8 });
    var building = new THREE.Mesh(buildingGeometry, tileMaterial);
    building.position.set(x, 6, z);
    building.castShadow = true;
    scene.add(building);

    for (var i = 0; i < 3; i++) {
      var nozzleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 6);
      var nozzle = new THREE.Mesh(nozzleGeometry, new THREE.MeshStandardMaterial({ color: 0x999999 }));
      nozzle.position.set(x - 4 + i * 4, 12, z);
      nozzle.castShadow = true;
      scene.add(nozzle);
    }
  }

  function buildGround() {
    var groundGeometry = new THREE.BoxGeometry(200, 1, 200);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.95 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    buildGround();

    buildSilo(-30, 0, false);
    buildSilo(0, 0, true);
    buildSilo(30, 0, false);

    buildGantry(-40, 15);
    buildGantry(40, 15);

    buildControlCenter();

    buildPerimeterFence();

    buildGuardTower(60, 60);
    buildGuardTower(-60, 60);
    buildGuardTower(60, -60);
    buildGuardTower(-60, -60);

    buildBlastDeflector(0, 35);
    buildBlastDeflector(0, -35);

    buildDecontaminationUnit(-50, -40);
    buildDecontaminationUnit(50, -40);

    var light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(40, 60, 40);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.far = 200;
    light.shadow.camera.left = -100;
    light.shadow.camera.right = 100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0x888888, 0.5);
    scene.add(ambientLight);
  }

  function update(delta) {
    animationTime += delta;

    if (guards.length > 0) {
      guards.forEach(function(guard) {
        guard.angle += delta * 0.3;
      });
    }

    if (launchMissile && launchMissile.active) {
      var missileY = launchMissile.baseY + (launchMissile.targetY - launchMissile.baseY) * (animationTime % 3) / 3;
      launchMissile.mesh.position.y = missileY;
    }
  }

  function reset() {
    animationTime = 0;
    if (launchMissile) {
      launchMissile.active = false;
      launchMissile.mesh.position.y = launchMissile.baseY;
    }
  }

  function launchActivate() {
    if (launchMissile) {
      launchMissile.active = true;
      animationTime = 0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset,
    launchActivate: launchActivate
  };
}());
