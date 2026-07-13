window.GlenLyonPost = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var torchLights = [];

  function createMacGregorCastle(scene) {
    var material = new THREE.MeshLambertMaterial({ color: 0x776655 });

    var mainKeep = new THREE.Mesh(
      new THREE.BoxGeometry(12, 12, 12),
      material
    );
    mainKeep.position.set(0, 6, 0);
    mainKeep.castShadow = true;
    mainKeep.receiveShadow = true;
    scene.add(mainKeep);
    objects.push(mainKeep);

    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var missingWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 8, 12),
      wallMaterial
    );
    missingWall1.position.set(5, 4, 0);
    missingWall1.castShadow = true;
    missingWall1.receiveShadow = true;
    scene.add(missingWall1);
    objects.push(missingWall1);

    var missingWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 6, 12),
      wallMaterial
    );
    missingWall2.position.set(-5, 3, 0);
    missingWall2.castShadow = true;
    missingWall2.receiveShadow = true;
    scene.add(missingWall2);
    objects.push(missingWall2);
  }

  function createBastionWalls(scene) {
    var material = new THREE.MeshLambertMaterial({ color: 0x667744 });

    var wall1 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 6, 12),
      material
    );
    wall1.position.set(15, 3, 0);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    scene.add(wall1);
    objects.push(wall1);

    var wall2 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 6, 12),
      material
    );
    wall2.position.set(-15, 3, 0);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    scene.add(wall2);
    objects.push(wall2);

    var wall3 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 6, 12),
      material
    );
    wall3.position.set(0, 3, 15);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    scene.add(wall3);
    objects.push(wall3);
  }

  function createSurveillanceTower(scene) {
    var material = new THREE.MeshLambertMaterial({ color: 0x444433 });

    var tower = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 20, 16),
      material
    );
    tower.position.set(25, 10, 25);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    objects.push(tower);
  }

  function createStreamFord(scene) {
    var material = new THREE.MeshLambertMaterial({ color: 0x667766 });

    var stone1 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 8),
      material
    );
    stone1.position.set(-5, 0.25, 8);
    stone1.castShadow = true;
    stone1.receiveShadow = true;
    scene.add(stone1);
    objects.push(stone1);

    var stone2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 8),
      material
    );
    stone2.position.set(0, 0.25, 8);
    stone2.castShadow = true;
    stone2.receiveShadow = true;
    scene.add(stone2);
    objects.push(stone2);

    var stone3 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 8),
      material
    );
    stone3.position.set(5, 0.25, 8);
    stone3.castShadow = true;
    stone3.receiveShadow = true;
    scene.add(stone3);
    objects.push(stone3);
  }

  function createCairnMemorial(scene) {
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });

    var sphere1 = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 8, 8),
      material
    );
    sphere1.position.set(-25, 2, -25);
    sphere1.castShadow = true;
    sphere1.receiveShadow = true;
    scene.add(sphere1);
    objects.push(sphere1);

    var sphere2 = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 8, 8),
      material
    );
    sphere2.position.set(-23, 3.5, -25);
    sphere2.castShadow = true;
    sphere2.receiveShadow = true;
    scene.add(sphere2);
    objects.push(sphere2);

    var sphere3 = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 8, 8),
      material
    );
    sphere3.position.set(-24, 2.5, -23);
    sphere3.castShadow = true;
    sphere3.receiveShadow = true;
    scene.add(sphere3);
    objects.push(sphere3);

    var sphere4 = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 8, 8),
      material
    );
    sphere4.position.set(-26, 3, -24);
    sphere4.castShadow = true;
    sphere4.receiveShadow = true;
    scene.add(sphere4);
    objects.push(sphere4);

    var sphere5 = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 8, 8),
      material
    );
    sphere5.position.set(-25, 4, -26);
    sphere5.castShadow = true;
    sphere5.receiveShadow = true;
    scene.add(sphere5);
    objects.push(sphere5);

    var sphere6 = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 8, 8),
      material
    );
    sphere6.position.set(-24, 2, -26);
    sphere6.castShadow = true;
    sphere6.receiveShadow = true;
    scene.add(sphere6);
    objects.push(sphere6);
  }

  function createWarfareVan(scene) {
    var material = new THREE.MeshLambertMaterial({ color: 0x4a5240 });

    var van = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4, 5),
      material
    );
    van.position.set(20, 2, -15);
    van.castShadow = true;
    van.receiveShadow = true;
    scene.add(van);
    objects.push(van);

    var antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 8, 8),
      material
    );
    antenna.position.set(22, 8, -15);
    antenna.castShadow = true;
    antenna.receiveShadow = true;
    scene.add(antenna);
    objects.push(antenna);
  }

  function createAmmoDump(scene) {
    var material = new THREE.MeshLambertMaterial({ color: 0x4a5240 });

    var crate1 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      material
    );
    crate1.position.set(-20, 1, 0);
    crate1.castShadow = true;
    crate1.receiveShadow = true;
    scene.add(crate1);
    objects.push(crate1);

    var crate2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      material
    );
    crate2.position.set(-18, 1, 0);
    crate2.castShadow = true;
    crate2.receiveShadow = true;
    scene.add(crate2);
    objects.push(crate2);

    var crate3 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      material
    );
    crate3.position.set(-20, 3, 0);
    crate3.castShadow = true;
    crate3.receiveShadow = true;
    scene.add(crate3);
    objects.push(crate3);

    var crate4 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      material
    );
    crate4.position.set(-18, 3, 0);
    crate4.castShadow = true;
    crate4.receiveShadow = true;
    scene.add(crate4);
    objects.push(crate4);
  }

  function createDeerBlinds(scene) {
    var material = new THREE.MeshLambertMaterial({ color: 0x667744 });

    var blind1 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      material
    );
    blind1.position.set(10, 0.75, -20);
    blind1.castShadow = true;
    blind1.receiveShadow = true;
    scene.add(blind1);
    objects.push(blind1);

    var blind2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      material
    );
    blind2.position.set(-10, 0.75, -20);
    blind2.castShadow = true;
    blind2.receiveShadow = true;
    scene.add(blind2);
    objects.push(blind2);

    var blind3 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      material
    );
    blind3.position.set(15, 0.75, 10);
    blind3.castShadow = true;
    blind3.receiveShadow = true;
    scene.add(blind3);
    objects.push(blind3);

    var blind4 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      material
    );
    blind4.position.set(-15, 0.75, 10);
    blind4.castShadow = true;
    blind4.receiveShadow = true;
    scene.add(blind4);
    objects.push(blind4);
  }

  function createClanFireTorches(scene) {
    var torchLight1 = new THREE.PointLight(0xFF6600, 0.8, 30);
    torchLight1.position.set(10, 5, 10);
    torchLight1.castShadow = true;
    scene.add(torchLight1);
    lights.push(torchLight1);
    torchLights.push(torchLight1);

    var torchLight2 = new THREE.PointLight(0xFF6600, 0.8, 30);
    torchLight2.position.set(-10, 5, -10);
    torchLight2.castShadow = true;
    scene.add(torchLight2);
    lights.push(torchLight2);
    torchLights.push(torchLight2);
  }

  function initialize(scene) {
    scene.background = new THREE.Color(0x667755);
    scene.fog = new THREE.Fog(0x667755, 100, 200);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    createMacGregorCastle(scene);
    createBastionWalls(scene);
    createSurveillanceTower(scene);
    createStreamFord(scene);
    createCairnMemorial(scene);
    createWarfareVan(scene);
    createAmmoDump(scene);
    createDeerBlinds(scene);
    createClanFireTorches(scene);
  }

  function update(delta) {
    var i;
    for (i = 0; i < torchLights.length; i = i + 1) {
      var intensity = 0.7 + 0.3 * Math.sin(Date.now() * 0.005 + i);
      torchLights[i].intensity = intensity;
    }
  }

  function reset(scene) {
    var i;
    for (i = 0; i < objects.length; i = i + 1) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (i = 0; i < lights.length; i = i + 1) {
      scene.remove(lights[i]);
    }
    lights = [];
    torchLights = [];
  }

  return {
    initialize: initialize,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
