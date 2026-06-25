window.StAndrewsPost = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createCathedralRuins(scene) {
    var geometry1 = new THREE.BoxGeometry(3, 18, 8);
    var material1 = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    var ruin1 = new THREE.Mesh(geometry1, material1);
    ruin1.position.set(-8, 9, 0);
    ruin1.rotation.z = Math.PI / 12;
    scene.add(ruin1);
    objects.push(ruin1);

    var geometry2 = new THREE.BoxGeometry(3, 18, 8);
    var material2 = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    var ruin2 = new THREE.Mesh(geometry2, material2);
    ruin2.position.set(8, 9, -2);
    ruin2.rotation.z = -Math.PI / 12;
    scene.add(ruin2);
    objects.push(ruin2);

    var geometry3 = new THREE.BoxGeometry(3, 18, 8);
    var material3 = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    var ruin3 = new THREE.Mesh(geometry3, material3);
    ruin3.position.set(0, 9, 6);
    ruin3.rotation.x = Math.PI / 16;
    scene.add(ruin3);
    objects.push(ruin3);
  }

  function createStRulesTower(scene) {
    var geometry = new THREE.BoxGeometry(4, 22, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(-15, 11, -8);
    scene.add(tower);
    objects.push(tower);
  }

  function createCastleCliff(scene) {
    var cliffGeometry = new THREE.BoxGeometry(2, 30, 8);
    var cliffMaterial = new THREE.MeshLambertMaterial({ color: 0x664433 });
    var cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
    cliff.position.set(20, 15, 10);
    scene.add(cliff);
    objects.push(cliff);

    var castleGeometry = new THREE.BoxGeometry(12, 10, 12);
    var castleMaterial = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var castle = new THREE.Mesh(castleGeometry, castleMaterial);
    castle.position.set(20, 30, 10);
    scene.add(castle);
    objects.push(castle);
  }

  function createGolfHut(scene) {
    var geometry = new THREE.BoxGeometry(6, 4, 5);
    var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var hut = new THREE.Mesh(geometry, material);
    hut.position.set(-25, 2, 15);
    scene.add(hut);
    objects.push(hut);
  }

  function createSwilcanBridge(scene) {
    var archGeometry = new THREE.BoxGeometry(6, 1, 3);
    var archMaterial = new THREE.MeshLambertMaterial({ color: 0x886644 });
    var arch = new THREE.Mesh(archGeometry, archMaterial);
    arch.position.set(-20, 2, 8);
    scene.add(arch);
    objects.push(arch);

    var passageGeometry = new THREE.CylinderGeometry(2, 2, 2, 32);
    var passageMaterial = new THREE.MeshLambertMaterial({ color: 0x774433 });
    var passage = new THREE.Mesh(passageGeometry, passageMaterial);
    passage.position.set(-20, 1, 8);
    passage.rotation.z = Math.PI / 2;
    scene.add(passage);
    objects.push(passage);
  }

  function createGolfBunkers(scene) {
    var positions = [
      [-30, 0.5, 20],
      [-35, 0.5, 25],
      [-32, 0.5, 28],
      [-28, 0.5, 22]
    ];

    for (var i = 0; i < positions.length; i++) {
      var bunkerGeometry = new THREE.SphereGeometry(2.5, 16, 16);
      var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0xCCBB88 });
      var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
      bunker.position.set(positions[i][0], positions[i][1], positions[i][2]);
      bunker.scale.y = 0.4;
      scene.add(bunker);
      objects.push(bunker);
    }

    var mgPosGeometry = new THREE.BoxGeometry(3, 1, 3);
    var mgPosMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var mgPos = new THREE.Mesh(mgPosGeometry, mgPosMaterial);
    mgPos.position.set(-32, 0.5, 24);
    scene.add(mgPos);
    objects.push(mgPos);
  }

  function createUniversityQuad(scene) {
    var wallPositions = [
      [-5, 2.5, -12],
      [5, 2.5, -12],
      [5, 2.5, 12],
      [-5, 2.5, 12]
    ];

    var rotations = [0, 0, 0, 0];

    for (var i = 0; i < wallPositions.length; i++) {
      var wallGeometry = new THREE.BoxGeometry(1, 5, 16);
      var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x998877 });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(wallPositions[i][0], wallPositions[i][1], wallPositions[i][2]);
      if (i === 0 || i === 1) {
        wall.rotation.y = Math.PI / 2;
      }
      scene.add(wall);
      objects.push(wall);
    }
  }

  function createHelicopter(scene) {
    var hullGeometry = new THREE.BoxGeometry(8, 2, 4);
    var hullMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(20, 35, 10);
    scene.add(hull);
    objects.push(hull);

    var rotorGeometry = new THREE.CylinderGeometry(6, 6, 0.3, 32);
    var rotorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotor.position.set(20, 36.5, 10);
    rotor.name = 'rotor';
    scene.add(rotor);
    objects.push(rotor);
  }

  function createAmbientLight(scene) {
    var ambientLight = new THREE.AmbientLight(0xAABBBB, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);
  }

  function createFloodlights(scene) {
    var light1 = new THREE.PointLight(0xFFDD88, 1.2, 50);
    light1.position.set(-8, 12, 0);
    scene.add(light1);
    lights.push(light1);

    var light2 = new THREE.PointLight(0xFFDD88, 1.2, 50);
    light2.position.set(8, 12, -2);
    scene.add(light2);
    lights.push(light2);
  }

  function initialize(scene) {
    createCathedralRuins(scene);
    createStRulesTower(scene);
    createCastleCliff(scene);
    createGolfHut(scene);
    createSwilcanBridge(scene);
    createGolfBunkers(scene);
    createUniversityQuad(scene);
    createHelicopter(scene);
    createAmbientLight(scene);
    createFloodlights(scene);
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].name === 'rotor') {
        objects[i].rotation.y += delta * 8;
      }
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    objects = [];
    lights = [];
  }

  return {
    initialize: initialize,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
