window.FortingallFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function addMesh(mesh) {
    objects.push(mesh);
  }

  function addLight(light) {
    lights.push(light);
  }

  function createYewTrunk() {
    var trunkGeometry = new THREE.CylinderGeometry(3, 3, 6, 32);
    var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2a10 });
    var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(0, 3, 0);
    addMesh(trunk);
    return trunk;
  }

  function createYewBranches() {
    var positions = [
      [-4, 7, -3],
      [4, 8, -2],
      [3, 9, 3],
      [-3, 8, 4],
      [5, 7, 1],
      [-5, 9, -4]
    ];

    var branchMaterial = new THREE.MeshLambertMaterial({ color: 0x336633 });

    positions.forEach(function(pos) {
      var branchGeometry = new THREE.SphereGeometry(3, 16, 16);
      var branch = new THREE.Mesh(branchGeometry, branchMaterial);
      branch.position.set(pos[0], pos[1], pos[2]);
      addMesh(branch);
    });
  }

  function createChurchyardWall() {
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });

    var wallPositions = [
      [12, 1, 0],
      [-12, 1, 0],
      [0, 1, 12],
      [0, 1, -12]
    ];

    var wallRotations = [
      0,
      0,
      Math.PI / 2,
      Math.PI / 2
    ];

    wallPositions.forEach(function(pos, index) {
      var wallGeometry = new THREE.BoxGeometry(0.5, 2, 12);
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(pos[0], pos[1], pos[2]);
      wall.rotation.y = wallRotations[index];
      addMesh(wall);
    });
  }

  function createChurch() {
    var bodyGeometry = new THREE.BoxGeometry(10, 6, 14);
    var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(20, 3, 0);
    addMesh(body);

    var towerGeometry = new THREE.BoxGeometry(4, 10, 4);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(25, 5, 5);
    addMesh(tower);
  }

  function createRomanMound() {
    var moundMaterial = new THREE.MeshLambertMaterial({ color: 0x665544 });

    var moundPositions = [
      [30, 1.5, 20],
      [-30, 1.5, 20],
      [-30, 1.5, -20],
      [30, 1.5, -20]
    ];

    var moundRotations = [
      0,
      0,
      Math.PI / 2,
      Math.PI / 2
    ];

    moundPositions.forEach(function(pos, index) {
      var moundGeometry = new THREE.BoxGeometry(1, 3, 20);
      var mound = new THREE.Mesh(moundGeometry, moundMaterial);
      mound.position.set(pos[0], pos[1], pos[2]);
      mound.rotation.y = moundRotations[index];
      addMesh(mound);
    });
  }

  function createTimeCapsule() {
    var capsuleGeometry = new THREE.BoxGeometry(2, 4, 2);
    var capsuleMaterial = new THREE.MeshLambertMaterial({ color: 0x999988 });
    var capsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
    capsule.position.set(-20, 2, -15);
    addMesh(capsule);

    var plaqueGeometry = new THREE.BoxGeometry(1.5, 1, 0.2);
    var plaqueMaterial = new THREE.MeshLambertMaterial({ color: 0xCD7F32 });
    var plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial);
    plaque.position.set(-20, 2.5, -16.1);
    addMesh(plaque);
  }

  function createBunker() {
    var bunkerGeometry = new THREE.BoxGeometry(8, 2, 6);
    var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x5C4030 });
    var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.set(-25, 1, 10);
    addMesh(bunker);
  }

  function createDefensiveLines() {
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });

    for (var i = 0; i < 8; i++) {
      var points = [];
      var startZ = -40 + i * 10;
      points.push(new THREE.Vector3(-50, 0.1, startZ));
      points.push(new THREE.Vector3(50, 0.1, startZ));

      var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      var line = new THREE.LineSegments(lineGeometry, lineMaterial);
      addMesh(line);
    }
  }

  function createStoneCircle() {
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x998866 });

    var stonePositions = [
      [-15, 2, 25],
      [-5, 2, 28],
      [5, 2, 25],
      [15, 2, 28]
    ];

    stonePositions.forEach(function(pos) {
      var stoneGeometry = new THREE.BoxGeometry(0.5, 4, 0.5);
      var stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      stone.position.set(pos[0], pos[1], pos[2]);
      addMesh(stone);
    });
  }

  function createLights() {
    var ambientLight = new THREE.AmbientLight(0xAACC66, 0.7);
    addLight(ambientLight);

    var spotLight = new THREE.SpotLight(0xFF9900, 1.2);
    spotLight.position.set(0, 12, -5);
    spotLight.target.position.set(0, 3, 0);
    addLight(spotLight);
  }

  function initialize(scene) {
    createYewTrunk();
    createYewBranches();
    createChurchyardWall();
    createChurch();
    createRomanMound();
    createTimeCapsule();
    createBunker();
    createDefensiveLines();
    createStoneCircle();
    createLights();

    objects.forEach(function(mesh) {
      scene.add(mesh);
    });

    lights.forEach(function(light) {
      scene.add(light);
    });
  }

  function update(delta) {
    for (var i = 1; i < 7; i++) {
      if (objects[i]) {
        objects[i].rotation.x += 0.05 * delta;
        objects[i].rotation.y += 0.03 * delta;
      }
    }
  }

  function reset(scene) {
    objects.forEach(function(mesh) {
      scene.remove(mesh);
    });

    lights.forEach(function(light) {
      scene.remove(light);
    });

    objects = [];
    lights = [];
  }

  return {
    initialize: initialize,
    update: update,
    reset: reset,
    getObjects: function() { return objects; },
    getLights: function() { return lights; }
  };
}());
