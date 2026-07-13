window.TyndrumUpperBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var craneArm = null;

  function createBoxMesh(width, height, depth, color) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createCylinderMesh(radiusTop, radiusBottom, height, color) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createSphereMesh(radius, color) {
    var geometry = new THREE.SphereGeometry(radius, 32, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createConeMesh(radius, height, color) {
    var geometry = new THREE.ConeGeometry(radius, height, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function buildRailwayStation() {
    var platform = createBoxMesh(30, 0.5, 4, 0x888888);
    platform.position.set(0, 0.25, 0);
    objects.push(platform);

    var building = createBoxMesh(10, 5, 8, 0xEEEEDD);
    building.position.set(8, 2.5, -10);
    objects.push(building);

    var chimney = createCylinderMesh(0.5, 0.5, 3, 0xAA7777);
    chimney.position.set(10, 8, -8);
    objects.push(chimney);
  }

  function buildRailJunction() {
    var junctionLeft = createBoxMesh(20, 0.5, 2, 0x444444);
    junctionLeft.rotation.z = 0.785;
    junctionLeft.position.set(-8, 0.3, 5);
    objects.push(junctionLeft);

    var junctionRight = createBoxMesh(20, 0.5, 2, 0x444444);
    junctionRight.rotation.z = -0.785;
    junctionRight.position.set(8, 0.3, 5);
    objects.push(junctionRight);
  }

  function buildGoldMine() {
    var entrance = createBoxMesh(6, 4, 6, 0x8B5E3C);
    entrance.position.set(-20, 2, 15);
    objects.push(entrance);

    var shaft = createCylinderMesh(2, 2, 4, 0x555555);
    shaft.position.set(-20, 2, 15);
    objects.push(shaft);
  }

  function buildTailingsHeap() {
    var mound1 = createSphereMesh(4, 0xCCBB88);
    mound1.position.set(-25, 2, 10);
    objects.push(mound1);

    var mound2 = createSphereMesh(3.5, 0xCCBB88);
    mound2.position.set(-18, 1.5, 12);
    objects.push(mound2);

    var mound3 = createSphereMesh(3, 0xCCBB88);
    mound3.position.set(-22, 1, 8);
    objects.push(mound3);
  }

  function buildCheckpoint() {
    var arm = createBoxMesh(8, 0.3, 0.3, 0xCC2222);
    arm.position.set(15, 1.5, -5);
    objects.push(arm);

    var post1 = createCylinderMesh(0.4, 0.4, 3, 0x333333);
    post1.position.set(11, 1.5, -5);
    objects.push(post1);

    var post2 = createCylinderMesh(0.4, 0.4, 3, 0x333333);
    post2.position.set(19, 1.5, -5);
    objects.push(post2);
  }

  function buildSupplyTrain() {
    var trainCar = createBoxMesh(16, 3, 4, 0x555555);
    trainCar.position.set(5, 1.5, 25);
    objects.push(trainCar);
  }

  function buildCrane() {
    var base = createCylinderMesh(1, 1, 10, 0xFFCC00);
    base.position.set(-15, 5, 20);
    objects.push(base);

    craneArm = createBoxMesh(12, 0.4, 0.4, 0xFFCC00);
    craneArm.position.set(-15, 10.5, 20);
    objects.push(craneArm);
  }

  function buildWellyStop() {
    var cafe = createBoxMesh(8, 4, 6, 0x336633);
    cafe.position.set(25, 2, 0);
    objects.push(cafe);
  }

  function setupLights() {
    var ambient = new THREE.AmbientLight(0xAABBAA, 0.6);
    lights.push(ambient);

    var mineLight = new THREE.PointLight(0xFFEE88, 1.0);
    mineLight.position.set(-20, 5, 15);
    lights.push(mineLight);
  }

  function setup(scene) {
    buildRailwayStation();
    buildRailJunction();
    buildGoldMine();
    buildTailingsHeap();
    buildCheckpoint();
    buildSupplyTrain();
    buildCrane();
    buildWellyStop();
    setupLights();

    for (var i = 0; i < objects.length; i++) {
      scene.add(objects[i]);
    }

    for (var j = 0; j < lights.length; j++) {
      scene.add(lights[j]);
    }
  }

  function update(delta) {
    if (craneArm) {
      craneArm.rotation.y += delta * 0.5;
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
    craneArm = null;
  }

  return {
    setup: setup,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
