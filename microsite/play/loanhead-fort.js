window.LoanheadFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createGeometry(type, params) {
    if (type === 'box') {
      return new THREE.BoxGeometry(params[0], params[1], params[2]);
    } else if (type === 'cylinder') {
      return new THREE.CylinderGeometry(params[0], params[1], params[2], params[3]);
    } else if (type === 'sphere') {
      return new THREE.SphereGeometry(params[0], params[1], params[2]);
    } else if (type === 'cone') {
      return new THREE.ConeGeometry(params[0], params[1], params[2]);
    }
    return null;
  }

  function createMaterial(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function addMesh(scene, geometry, material, x, y, z, rotX, rotY, rotZ) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (rotX) mesh.rotation.x = rotX;
    if (rotY) mesh.rotation.y = rotY;
    if (rotZ) mesh.rotation.z = rotZ;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildCollieryHeadframe(scene) {
    var legGeo = createGeometry('box', [2, 16, 1]);
    var legMat = createMaterial(0x333344);

    var legLeft = addMesh(scene, legGeo, legMat, -3, 8, 0, 0, 0, -0.3);
    var legRight = addMesh(scene, legGeo, legMat, 3, 8, 0, 0, 0, 0.3);

    var crossbarGeo = createGeometry('box', [8, 1, 1]);
    var crossbarMat = createMaterial(0x333344);
    addMesh(scene, crossbarGeo, crossbarMat, 0, 15.5, 0);

    var wheelGeo = createGeometry('cylinder', [1.5, 1.5, 0.3, 16]);
    var wheelMat = createMaterial(0x222222);
    var wheel = addMesh(scene, wheelGeo, wheelMat, 0, 15.8, 0);
    wheel.windingWheel = true;
  }

  function buildWindingEngineHouse(scene) {
    var houseGeo = createGeometry('box', [14, 8, 10]);
    var houseMat = createMaterial(0x8B3A3A);
    addMesh(scene, houseGeo, houseMat, 20, 4, 5);

    var windowGeo = createGeometry('cylinder', [1.2, 1.2, 0.3, 16]);
    var windowMat = createMaterial(0x444455);
    addMesh(scene, windowGeo, windowMat, 20, 6, 10.2);
  }

  function buildCoalSpoilHeap(scene) {
    var baseGeo = createGeometry('box', [18, 2, 16]);
    var baseMat = createMaterial(0x333322);
    addMesh(scene, baseGeo, baseMat, -15, 1, -20);

    var sphere1Geo = createGeometry('sphere', [4, 8, 8]);
    var sphereMat = createMaterial(0x222211);
    addMesh(scene, sphere1Geo, sphereMat, -18, 6, -18);

    var sphere2Geo = createGeometry('sphere', [3.5, 8, 8]);
    addMesh(scene, sphere2Geo, sphereMat, -12, 5.5, -22);

    var sphere3Geo = createGeometry('sphere', [3, 8, 8]);
    addMesh(scene, sphere3Geo, sphereMat, -10, 5, -15);
  }

  function buildMiningShaftCollar(scene) {
    var collarGeo = createGeometry('cylinder', [2, 2, 2, 16]);
    var collarMat = createMaterial(0x888888);
    addMesh(scene, collarGeo, collarMat, -3, 1, 0);
  }

  function buildMilitaryCheckpoint(scene) {
    var barrierGeo = createGeometry('box', [8, 1, 0.3]);
    var barrierMat = createMaterial(0x888877);
    addMesh(scene, barrierGeo, barrierMat, -25, 0.5, 15);
    addMesh(scene, barrierGeo, barrierMat, -25, 0.5, 17);

    var armGeo = createGeometry('box', [0.3, 0.3, 4]);
    addMesh(scene, armGeo, barrierMat, -20, 1, 15);
  }

  function buildMedicalComplex(scene) {
    var medicalGeo = createGeometry('box', [16, 6, 12]);
    var medicalMat = createMaterial(0xFFFFFF);
    addMesh(scene, medicalGeo, medicalMat, 25, 3, -10);
  }

  function buildHospitalTent(scene) {
    var tentGeo = createGeometry('box', [12, 5, 10]);
    var tentMat = createMaterial(0xFFFFFF);
    addMesh(scene, tentGeo, tentMat, 35, 2.5, 0);

    var crossGeo = createGeometry('box', [0.5, 4, 0.5]);
    var crossMat = createMaterial(0xFF0000);
    addMesh(scene, crossGeo, crossMat, 35, 3.5, 0);

    var crossVertGeo = createGeometry('box', [0.5, 0.5, 4]);
    addMesh(scene, crossVertGeo, crossMat, 35, 3.5, 0);
  }

  function buildRowCottages(scene) {
    var cottageGeo = createGeometry('box', [5, 4, 5]);
    var cottageMat = createMaterial(0x998877);

    addMesh(scene, cottageGeo, cottageMat, -35, 2, 5);
    addMesh(scene, cottageGeo, cottageMat, -28, 2, 5);
    addMesh(scene, cottageGeo, cottageMat, -21, 2, 5);
    addMesh(scene, cottageGeo, cottageMat, -35, 2, 12);
    addMesh(scene, cottageGeo, cottageMat, -28, 2, 12);
    addMesh(scene, cottageGeo, cottageMat, -21, 2, 12);
  }

  function addLights(scene) {
    var ambientGeo = createGeometry('sphere', [0.1, 4, 4]);
    var ambientLight = new THREE.AmbientLight(0x9999AA, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var hospitalLightGeo = createGeometry('sphere', [0.5, 8, 8]);
    var hospitalLight = new THREE.PointLight(0xFF2200, 0.8, 50);
    hospitalLight.position.set(35, 6, 0);
    scene.add(hospitalLight);
    lights.push(hospitalLight);

    var checkpointLight = new THREE.PointLight(0xFF8800, 0.9, 40);
    checkpointLight.position.set(-25, 3, 15);
    scene.add(checkpointLight);
    lights.push(checkpointLight);
  }

  function build(scene) {
    buildCollieryHeadframe(scene);
    buildWindingEngineHouse(scene);
    buildCoalSpoilHeap(scene);
    buildMiningShaftCollar(scene);
    buildMilitaryCheckpoint(scene);
    buildMedicalComplex(scene);
    buildHospitalTent(scene);
    buildRowCottages(scene);
    addLights(scene);
  }

  function update(delta) {
    var i = 0;
    for (i = 0; i < objects.length; i++) {
      if (objects[i].windingWheel) {
        objects[i].rotation.z += delta * 0.5;
      }
    }
  }

  function reset(scene) {
    var i = 0;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    lights = [];
  }

  return {
    build: build,
    update: update,
    reset: reset,
    objects: function() { return objects; },
    lights: function() { return lights; }
  };
}());
