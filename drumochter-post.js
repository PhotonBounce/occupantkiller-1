window.DrumochterPost = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function summitMarker(scene) {
    var pillarGeom = new THREE.BoxGeometry(1, 5, 1);
    var pillarMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var pillar = new THREE.Mesh(pillarGeom, pillarMat);
    pillar.position.y = 2.5;
    scene.add(pillar);
    objects.push(pillar);

    var trigGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var trigMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var trig = new THREE.Mesh(trigGeom, trigMat);
    trig.position.y = 5.25;
    scene.add(trig);
    objects.push(trig);
  }

  function commandBunker(scene) {
    var bunkerGeom = new THREE.BoxGeometry(10, 3, 8);
    var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x5C4030 });
    var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
    bunker.position.set(15, 1.5, 0);
    scene.add(bunker);
    objects.push(bunker);

    var interiorGeom = new THREE.BoxGeometry(9, 2, 7);
    var interiorMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var interior = new THREE.Mesh(interiorGeom, interiorMat);
    interior.position.set(15, 1.5, 0);
    interior.position.z += 0.1;
    scene.add(interior);
    objects.push(interior);
  }

  function mastArray(scene) {
    var positions = [
      { x: -8, z: -5, angle: 0 },
      { x: -8, z: 0, angle: Math.PI / 6 },
      { x: -8, z: 5, angle: -Math.PI / 6 }
    ];

    positions.forEach(function(pos) {
      var mastGeom = new THREE.CylinderGeometry(0.4, 0.4, 20, 8);
      var mastMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var mast = new THREE.Mesh(mastGeom, mastMat);
      mast.position.set(pos.x, 10, pos.z);
      mast.rotation.z = pos.angle;
      scene.add(mast);
      objects.push(mast);

      var dishGeom = new THREE.BoxGeometry(3, 2, 0.4);
      var dishMat = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
      var dish = new THREE.Mesh(dishGeom, dishMat);
      dish.position.set(pos.x, 20, pos.z);
      dish.userData.mastIndex = positions.indexOf(pos);
      scene.add(dish);
      objects.push(dish);
    });
  }

  function checkpoint(scene) {
    var barrierGeom = new THREE.BoxGeometry(1, 1, 12);
    var barrierMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var barrier = new THREE.Mesh(barrierGeom, barrierMat);
    barrier.position.set(0, 0.5, -20);
    scene.add(barrier);
    objects.push(barrier);

    var postPositions = [-6, -2, 2, 6];
    postPositions.forEach(function(zPos) {
      var postGeom = new THREE.BoxGeometry(0.5, 3, 0.5);
      var postMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(5, 1.5, zPos - 20);
      scene.add(post);
      objects.push(post);
    });
  }

  function snowfieldMarkers(scene) {
    var markerPositions = [
      { x: -15, z: -10 },
      { x: -10, z: -15 },
      { x: 5, z: -12 },
      { x: 10, z: -8 },
      { x: -5, z: 10 },
      { x: 12, z: 8 }
    ];

    markerPositions.forEach(function(pos) {
      var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
      var poleMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(pos.x, 2, pos.z);
      scene.add(pole);
      objects.push(pole);
    });
  }

  function cattleShelter(scene) {
    var shelterGeom = new THREE.BoxGeometry(10, 4, 8);
    var shelterMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var shelter = new THREE.Mesh(shelterGeom, shelterMat);
    shelter.position.set(-25, 2, -10);
    scene.add(shelter);
    objects.push(shelter);
  }

  function observationPost(scene) {
    var ringGeom = new THREE.CylinderGeometry(3, 3, 1, 32);
    var ringMat = new THREE.MeshLambertMaterial({ color: 0xC2A06E });
    var ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.set(20, 0.5, 15);
    scene.add(ring);
    objects.push(ring);

    var wallGeom = new THREE.BoxGeometry(6, 2, 0.4);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0xC2A06E });
    var wall = new THREE.Mesh(wallGeom, wallMat);
    wall.position.set(20, 1, 15);
    scene.add(wall);
    objects.push(wall);
  }

  function survivalCrates(scene) {
    var cratePositions = [
      { x: -20, z: 5 },
      { x: -18, z: 5 },
      { x: -22, z: 7 },
      { x: -20, z: 9 }
    ];

    cratePositions.forEach(function(pos) {
      var crateGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var crateMat = new THREE.MeshLambertMaterial({ color: 0x4a5240 });
      var crate = new THREE.Mesh(crateGeom, crateMat);
      crate.position.set(pos.x, 0.75, pos.z);
      scene.add(crate);
      objects.push(crate);
    });
  }

  function ambientLighting(scene) {
    var ambientLight = new THREE.AmbientLight(0x8899BB, 0.4);
    scene.add(ambientLight);
    lights.push(ambientLight);
  }

  function dangerLight(scene) {
    var dangerLight = new THREE.PointLight(0xFF0000, 1, 50);
    dangerLight.position.set(-8, 20.5, 0);
    scene.add(dangerLight);
    lights.push(dangerLight);
  }

  function update(delta) {
    objects.forEach(function(obj) {
      if (obj.userData.mastIndex !== undefined) {
        obj.rotation.y += delta * 0.5;
      }
    });
  }

  function reset(scene) {
    objects.forEach(function(obj) {
      scene.remove(obj);
    });
    objects = [];

    lights.forEach(function(light) {
      scene.remove(light);
    });
    lights = [];
  }

  function create(scene) {
    reset(scene);
    summitMarker(scene);
    commandBunker(scene);
    mastArray(scene);
    checkpoint(scene);
    snowfieldMarkers(scene);
    cattleShelter(scene);
    observationPost(scene);
    survivalCrates(scene);
    ambientLighting(scene);
    dangerLight(scene);
  }

  return {
    create: create,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
