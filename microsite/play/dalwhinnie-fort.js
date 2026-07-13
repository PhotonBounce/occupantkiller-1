window.DalwhinnieFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createDistilleryBlock() {
    var geometry = new THREE.BoxGeometry(18, 7, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 3.5;
    mesh.position.z = 0;
    return mesh;
  }

  function createSnowRoof() {
    var geometry = new THREE.BoxGeometry(18, 1, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 8;
    mesh.position.z = 0;
    return mesh;
  }

  function createWormTub() {
    var geometry = new THREE.CylinderGeometry(2.5, 2.5, 4, 32);
    var material = new THREE.MeshLambertMaterial({ color: 0xB87333 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 2;
    return mesh;
  }

  function createWormTubs() {
    var tub1 = createWormTub();
    tub1.position.x = -6;
    tub1.position.z = 8;
    objects.push(tub1);

    var tub2 = createWormTub();
    tub2.position.x = 6;
    tub2.position.z = 8;
    objects.push(tub2);

    return [tub1, tub2];
  }

  function createCheckpoint() {
    var geometry = new THREE.BoxGeometry(8, 5, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = -20;
    mesh.position.y = 2.5;
    mesh.position.z = -15;
    return mesh;
  }

  function createArmBarrier() {
    var geometry = new THREE.BoxGeometry(6, 0.4, 0.4);
    var material = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = -14;
    mesh.position.y = 3;
    mesh.position.z = -15;
    return mesh;
  }

  function createRoadBarricade() {
    var blocks = [];
    var geometry = new THREE.BoxGeometry(20, 1, 1);
    var material = new THREE.MeshLambertMaterial({ color: 0x999988 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.5;
    mesh.position.z = -25;
    return mesh;
  }

  function createSnowPlough() {
    var body = new THREE.BoxGeometry(10, 3, 4);
    var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF8800 });
    var bodyMesh = new THREE.Mesh(body, bodyMaterial);
    bodyMesh.position.x = 25;
    bodyMesh.position.y = 1.5;
    bodyMesh.position.z = -30;

    var blade = new THREE.BoxGeometry(8, 2, 0.5);
    var bladeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF8800 });
    var bladeMesh = new THREE.Mesh(blade, bladeMaterial);
    bladeMesh.position.x = 30;
    bladeMesh.position.y = 0.5;
    bladeMesh.position.z = -30;
    bladeMesh.rotation.z = 0.3;

    objects.push(bodyMesh);
    objects.push(bladeMesh);

    return [bodyMesh, bladeMesh];
  }

  function createRadarDome() {
    var geometry = new THREE.SphereGeometry(3, 32, 32);
    var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 10;
    mesh.position.z = 0;
    mesh.name = 'radarDome';
    return mesh;
  }

  function createWindFence() {
    var points = [];
    var spacing = 3;
    var height = 8;
    var width = 4;

    var x = -30;
    var z = 20;

    for (var i = 0; i < 15; i++) {
      points.push(new THREE.Vector3(x, 0, z));
      points.push(new THREE.Vector3(x, height, z));

      if (i % 2 === 0) {
        x += width;
      } else {
        x -= width;
      }
      z += spacing;
    }

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    var mesh = new THREE.LineSegments(geometry, material);
    return mesh;
  }

  function createEquipmentStore() {
    var geometry = new THREE.BoxGeometry(10, 4, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x3a4a30 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = -15;
    mesh.position.y = 2;
    mesh.position.z = 12;
    return mesh;
  }

  function createAmbientLight() {
    var light = new THREE.AmbientLight(0xCCDDFF, 0.5);
    return light;
  }

  function createDistilleryLight() {
    var light = new THREE.PointLight(0xFFEE88, 1.0, 50);
    light.position.set(0, 10, 0);
    return light;
  }

  function init() {
    var distilleryBlock = createDistilleryBlock();
    objects.push(distilleryBlock);

    var snowRoof = createSnowRoof();
    objects.push(snowRoof);

    createWormTubs();

    var checkpoint = createCheckpoint();
    objects.push(checkpoint);

    var armBarrier = createArmBarrier();
    objects.push(armBarrier);

    var roadBarricade = createRoadBarricade();
    objects.push(roadBarricade);

    createSnowPlough();

    var radarDome = createRadarDome();
    objects.push(radarDome);

    var windFence = createWindFence();
    objects.push(windFence);

    var equipmentStore = createEquipmentStore();
    objects.push(equipmentStore);

    var ambientLight = createAmbientLight();
    lights.push(ambientLight);

    var distilleryLight = createDistilleryLight();
    lights.push(distilleryLight);
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].name === 'radarDome') {
        objects[i].rotation.y += delta * 0.5;
      }
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    lights = [];
  }

  function getObjects() {
    return objects;
  }

  function getLights() {
    return lights;
  }

  init();

  return {
    objects: objects,
    lights: lights,
    update: update,
    reset: reset,
    getObjects: getObjects,
    getLights: getLights
  };
}());
