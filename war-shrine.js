window.WarShrine = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var braziers = [];
  var lights = [];
  var time = 0;

  function createMaterial(color, emissive) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      metalness: 0.6,
      roughness: 0.4
    });
  }

  function buildFloor() {
    var geometry = new THREE.BoxGeometry(40, 1, 40);
    var material = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.3,
      roughness: 0.9
    });
    var floor = new THREE.Mesh(geometry, material);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);
  }

  function buildPillars() {
    var positions = [
      [-12, 0, -12],
      [12, 0, -12],
      [-12, 0, 12],
      [12, 0, 12]
    ];

    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.CylinderGeometry(2, 2.2, 12, 8);
      var material = createMaterial(0x4a4a4a, 0x1a1a1a);
      var pillar = new THREE.Mesh(geometry, material);
      pillar.position.set(positions[i][0], positions[i][1] + 6, positions[i][2]);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      objects.push(pillar);

      var capGeometry = new THREE.ConeGeometry(2.4, 2, 8);
      var cap = new THREE.Mesh(capGeometry, material);
      cap.position.set(positions[i][0], positions[i][1] + 13, positions[i][2]);
      cap.castShadow = true;
      scene.add(cap);
      objects.push(cap);
    }
  }

  function buildCentralIdol() {
    var group = new THREE.Group();

    var baseGeometry = new THREE.ConeGeometry(3, 2, 6);
    var baseMaterial = createMaterial(0x8b0000, 0x440000);
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1;
    base.castShadow = true;
    group.add(base);

    var swordGeometry = new THREE.BoxGeometry(0.8, 6, 0.15);
    var metalMaterial = createMaterial(0xaaaaaa, 0x444444);

    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var sword = new THREE.Mesh(swordGeometry, metalMaterial);
      sword.position.y = 4;
      sword.rotation.z = angle;
      sword.castShadow = true;
      group.add(sword);
    }

    var idolCore = new THREE.SphereGeometry(2, 8, 8);
    var coreMaterial = createMaterial(0x1a1a1a, 0x660000);
    var core = new THREE.Mesh(idolCore, coreMaterial);
    core.position.y = 5;
    core.castShadow = true;
    group.add(core);

    group.position.set(0, 0, 0);
    scene.add(group);
    objects.push(group);
  }

  function buildAltar() {
    var altarGeometry = new THREE.BoxGeometry(8, 2.5, 5);
    var altarMaterial = createMaterial(0x3a3a3a, 0x1a0000);
    var altar = new THREE.Mesh(altarGeometry, altarMaterial);
    altar.position.set(-10, 1.25, 8);
    altar.castShadow = true;
    altar.receiveShadow = true;
    scene.add(altar);
    objects.push(altar);

    var sideGeometry = new THREE.BoxGeometry(1, 3, 5);
    var side1 = new THREE.Mesh(sideGeometry, altarMaterial);
    side1.position.set(-14.5, 1.5, 8);
    side1.castShadow = true;
    scene.add(side1);
    objects.push(side1);

    var side2 = new THREE.Mesh(sideGeometry, altarMaterial);
    side2.position.set(-5.5, 1.5, 8);
    side2.castShadow = true;
    scene.add(side2);
    objects.push(side2);
  }

  function buildBrazier(x, z) {
    var group = new THREE.Group();

    var standsGeometry = new THREE.CylinderGeometry(1.2, 1.5, 3, 8);
    var bronzeMaterial = createMaterial(0x8b5a2b, 0x3a2a1a);
    var stand = new THREE.Mesh(standsGeometry, bronzeMaterial);
    stand.castShadow = true;
    group.add(stand);

    var bowlGeometry = new THREE.SphereGeometry(1.8, 8, 6);
    var bowl = new THREE.Mesh(bowlGeometry, bronzeMaterial);
    bowl.position.y = 2.2;
    bowl.scale.y = 0.6;
    bowl.castShadow = true;
    group.add(bowl);

    var flameGeometry = new THREE.ConeGeometry(0.8, 2.5, 4);
    var flameMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    var flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.y = 3.5;
    flame.castShadow = true;
    group.add(flame);

    group.position.set(x, 0, z);
    scene.add(group);
    objects.push(group);
    braziers.push({ group: group, flame: flame, time: Math.random() * Math.PI * 2 });

    var light = new THREE.PointLight(0xff8800, 1.5, 15);
    light.position.set(x, 4, z);
    light.castShadow = true;
    scene.add(light);
    lights.push(light);
  }

  function buildFallenStatue(x, z, rotation) {
    var group = new THREE.Group();

    var headGeometry = new THREE.SphereGeometry(1, 8, 8);
    var stoneMaterial = createMaterial(0x555555, 0x1a1a1a);
    var head = new THREE.Mesh(headGeometry, stoneMaterial);
    head.position.set(0, 0.8, 0);
    head.castShadow = true;
    group.add(head);

    var bodyGeometry = new THREE.BoxGeometry(1.2, 3, 0.8);
    var body = new THREE.Mesh(bodyGeometry, stoneMaterial);
    body.position.set(0, -0.5, 0);
    body.castShadow = true;
    group.add(body);

    var armGeometry = new THREE.BoxGeometry(0.6, 2.5, 0.5);
    var leftArm = new THREE.Mesh(armGeometry, stoneMaterial);
    leftArm.position.set(-1.2, -0.2, 0);
    leftArm.rotation.z = 0.3;
    leftArm.castShadow = true;
    group.add(leftArm);

    var rightArm = new THREE.Mesh(armGeometry, stoneMaterial);
    rightArm.position.set(1.2, -0.2, 0);
    rightArm.rotation.z = -0.3;
    rightArm.castShadow = true;
    group.add(rightArm);

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
    objects.push(group);
  }

  function buildWeaponOfferings() {
    var weaponMaterial = createMaterial(0x555555, 0x222222);

    var bladeGeometry = new THREE.BoxGeometry(0.4, 4, 0.05);
    for (var i = 0; i < 3; i++) {
      var blade = new THREE.Mesh(bladeGeometry, weaponMaterial);
      blade.position.set(-10 + i * 2, 3 + i * 0.5, 12);
      blade.rotation.z = i * 0.4;
      blade.castShadow = true;
      scene.add(blade);
      objects.push(blade);
    }

    var helmetGeometry = new THREE.SphereGeometry(0.9, 8, 6);
    for (var j = 0; j < 2; j++) {
      var helmet = new THREE.Mesh(helmetGeometry, weaponMaterial);
      helmet.position.set(8 + j * 3, 2.5, 12 + j * 2);
      helmet.castShadow = true;
      scene.add(helmet);
      objects.push(helmet);
    }
  }

  function buildWalls() {
    var wallMaterial = createMaterial(0x4a4a4a, 0x0a0a0a);
    var wallGeometry = new THREE.BoxGeometry(38, 8, 1);

    var wallNorth = new THREE.Mesh(wallGeometry, wallMaterial);
    wallNorth.position.set(0, 4, -20);
    wallNorth.castShadow = true;
    wallNorth.receiveShadow = true;
    scene.add(wallNorth);
    objects.push(wallNorth);

    var wallSouth = new THREE.Mesh(wallGeometry, wallMaterial);
    wallSouth.position.set(0, 4, 20);
    wallSouth.castShadow = true;
    wallSouth.receiveShadow = true;
    scene.add(wallSouth);
    objects.push(wallSouth);

    var sideWallGeometry = new THREE.BoxGeometry(1, 8, 38);
    var wallEast = new THREE.Mesh(sideWallGeometry, wallMaterial);
    wallEast.position.set(19, 4, 0);
    wallEast.castShadow = true;
    wallEast.receiveShadow = true;
    scene.add(wallEast);
    objects.push(wallEast);

    var wallWest = new THREE.Mesh(sideWallGeometry, wallMaterial);
    wallWest.position.set(-19, 4, 0);
    wallWest.castShadow = true;
    wallWest.receiveShadow = true;
    scene.add(wallWest);
    objects.push(wallWest);
  }

  function init(inputScene, camera) {
    scene = inputScene;
    time = 0;

    buildFloor();
    buildWalls();
    buildPillars();
    buildCentralIdol();
    buildAltar();
    buildBrazier(-16, -10);
    buildBrazier(16, -10);
    buildBrazier(-16, 14);
    buildBrazier(16, 14);
    buildFallenStatue(-8, -5, 0.5);
    buildFallenStatue(10, 5, -0.3);
    buildWeaponOfferings();

    var ambientLight = new THREE.AmbientLight(0x666666, 0.8);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);
    lights.push(directionalLight);
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < braziers.length; i++) {
      var brazier = braziers[i];
      brazier.time += delta * 3;

      var flameScale = 1 + Math.sin(brazier.time) * 0.3 + Math.sin(brazier.time * 0.7) * 0.2;
      brazier.flame.scale.y = flameScale;
      brazier.flame.scale.x = 1 + Math.sin(brazier.time * 1.3) * 0.15;
      brazier.flame.scale.z = 1 + Math.sin(brazier.time * 1.1) * 0.15;

      var flicker = 1.2 + Math.sin(brazier.time * 2) * 0.3;
      var lightIndex = 3 + i;
      if (lightIndex < lights.length) {
        lights[lightIndex].intensity = flicker;
      }
    }

    var shrineFlicker = 0.8 + Math.sin(time * 1.5) * 0.15;
    if (lights[0]) {
      lights[0].intensity = shrineFlicker;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }

    objects = [];
    braziers = [];
    lights = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
