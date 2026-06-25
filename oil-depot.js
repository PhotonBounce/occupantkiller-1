window.OilDepot = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var tanks = [];
  var structures = [];
  var particles = [];

  function createMaterial(color, emissive) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      metalness: 0.3,
      roughness: 0.7
    });
  }

  function buildStorageTanks() {
    var positions = [
      [-40, 0, -30], [-40, 0, 0], [-40, 0, 30],
      [0, 0, -30], [0, 0, 0], [0, 0, 30],
      [40, 0, -30], [40, 0, 30]
    ];

    var steelMat = createMaterial(0x4a4a4a, 0x000000);
    var coneMat = createMaterial(0x666666, 0x000000);

    positions.forEach(function(pos) {
      var tankGeom = new THREE.CylinderGeometry(8, 8, 20, 16);
      var tank = new THREE.Mesh(tankGeom, steelMat);
      tank.position.set(pos[0], 10, pos[2]);
      scene.add(tank);
      tanks.push(tank);

      var coneGeom = new THREE.ConeGeometry(8.5, 6, 16);
      var cone = new THREE.Mesh(coneGeom, coneMat);
      cone.position.set(pos[0], 30, pos[2]);
      scene.add(cone);

      var stairsGeom = new THREE.BoxGeometry(1, 15, 1);
      var stairs = new THREE.Mesh(stairsGeom, steelMat);
      stairs.position.set(pos[0] + 7, 8, pos[2]);
      stairs.rotation.z = Math.PI / 6;
      scene.add(stairs);
    });
  }

  function buildLoadingTerminal() {
    var steelMat = createMaterial(0x3a3a3a, 0x000000);
    var coneMat = createMaterial(0x555555, 0x000000);

    var dock1 = new THREE.BoxGeometry(6, 4, 8);
    var dockMesh1 = new THREE.Mesh(dock1, steelMat);
    dockMesh1.position.set(-55, 2, -10);
    scene.add(dockMesh1);

    var dock2 = new THREE.BoxGeometry(6, 4, 8);
    var dockMesh2 = new THREE.Mesh(dock2, steelMat);
    dockMesh2.position.set(-55, 2, 10);
    scene.add(dockMesh2);

    var trailerTank = new THREE.CylinderGeometry(2.5, 2.5, 12, 12);
    var trailer = new THREE.Mesh(trailerTank, coneMat);
    trailer.position.set(-50, 1.5, -10);
    trailer.rotation.z = Math.PI / 2;
    scene.add(trailer);

    var pumpBase = new THREE.BoxGeometry(4, 0.5, 6);
    var pump = new THREE.Mesh(pumpBase, steelMat);
    pump.position.set(-30, 0.25, 0);
    scene.add(pump);

    structures.push(dockMesh1, dockMesh2, trailer, pump);
  }

  function buildPipelineManifold() {
    var steelMat = createMaterial(0x2a2a2a, 0x000000);
    var valveMat = createMaterial(0xff6b35, 0x000000);

    var pipex = new THREE.BoxGeometry(25, 1, 1);
    var pipeXMesh = new THREE.Mesh(pipex, steelMat);
    pipeXMesh.position.set(0, 1, -18);
    scene.add(pipeXMesh);

    var pipez = new THREE.BoxGeometry(1, 1, 25);
    var pipeZMesh = new THREE.Mesh(pipez, steelMat);
    pipeZMesh.position.set(0, 1, 0);
    scene.add(pipeZMesh);

    for (var i = -3; i <= 3; i++) {
      var valveGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8);
      var valve = new THREE.Mesh(valveGeom, valveMat);
      valve.position.set(i * 8, 1.5, -18);
      scene.add(valve);
    }

    structures.push(pipeXMesh, pipeZMesh);
  }

  function buildBurningTank() {
    var fireMat = createMaterial(0xff4500, 0xff8800);
    var smokeMat = createMaterial(0x333333, 0x111111);

    var fireGeom = new THREE.CylinderGeometry(12, 12, 25, 16);
    var fireTank = new THREE.Mesh(fireGeom, fireMat);
    fireTank.position.set(60, 12.5, 0);
    scene.add(fireTank);

    var smokeGeom = new THREE.ConeGeometry(15, 40, 12);
    var smoke = new THREE.Mesh(smokeGeom, smokeMat);
    smoke.position.set(60, 40, 0);
    scene.add(smoke);

    structures.push(fireTank, smoke);
  }

  function buildBermWalls() {
    var bermMat = createMaterial(0x8b7355, 0x000000);

    var wallX1 = new THREE.BoxGeometry(100, 3, 1);
    var wX1 = new THREE.Mesh(wallX1, bermMat);
    wX1.position.set(0, 1.5, -50);
    scene.add(wX1);

    var wallX2 = new THREE.BoxGeometry(100, 3, 1);
    var wX2 = new THREE.Mesh(wallX2, bermMat);
    wX2.position.set(0, 1.5, 50);
    scene.add(wX2);

    var wallZ1 = new THREE.BoxGeometry(1, 3, 100);
    var wZ1 = new THREE.Mesh(wallZ1, bermMat);
    wZ1.position.set(-50, 1.5, 0);
    scene.add(wZ1);

    var wallZ2 = new THREE.BoxGeometry(1, 3, 100);
    var wZ2 = new THREE.Mesh(wallZ2, bermMat);
    wZ2.position.set(50, 1.5, 0);
    scene.add(wZ2);

    structures.push(wX1, wX2, wZ1, wZ2);
  }

  function buildControlRoom() {
    var concreteMat = createMaterial(0x696969, 0x000000);

    var bodyGeom = new THREE.BoxGeometry(10, 8, 12);
    var body = new THREE.Mesh(bodyGeom, concreteMat);
    body.position.set(-70, 4, 35);
    scene.add(body);

    var roofGeom = new THREE.ConeGeometry(7, 4, 4);
    var roof = new THREE.Mesh(roofGeom, concreteMat);
    roof.position.set(-70, 12, 35);
    scene.add(roof);

    structures.push(body, roof);
  }

  function buildPumpStation() {
    var metalMat = createMaterial(0x505050, 0x000000);

    var shedGeom = new THREE.BoxGeometry(14, 6, 10);
    var shed = new THREE.Mesh(shedGeom, metalMat);
    shed.position.set(75, 3, -20);
    scene.add(shed);

    for (var i = 0; i < 3; i++) {
      var pumpGeom = new THREE.CylinderGeometry(1.2, 1.2, 4, 8);
      var pump = new THREE.Mesh(pumpGeom, metalMat);
      pump.position.set(70 + i * 5, 4, -18);
      scene.add(pump);
    }

    structures.push(shed);
  }

  function buildUndergroundPipes() {
    var lineMat = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });

    var pipePoints1 = [
      new THREE.Vector3(-40, 0, 0),
      new THREE.Vector3(-30, 0, 0),
      new THREE.Vector3(-20, 0, 10),
      new THREE.Vector3(0, 0, 15)
    ];
    var pipeGeom1 = new THREE.BufferGeometry().setFromPoints(pipePoints1);
    var pipe1 = new THREE.LineSegments(pipeGeom1, lineMat);
    scene.add(pipe1);

    var pipePoints2 = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(20, 0, 0),
      new THREE.Vector3(40, 0, 5),
      new THREE.Vector3(60, 0, 10)
    ];
    var pipeGeom2 = new THREE.BufferGeometry().setFromPoints(pipePoints2);
    var pipe2 = new THREE.LineSegments(pipeGeom2, lineMat);
    scene.add(pipe2);

    var pipePoints3 = [
      new THREE.Vector3(60, 0, 0),
      new THREE.Vector3(70, 0, -10),
      new THREE.Vector3(80, 0, -20)
    ];
    var pipeGeom3 = new THREE.BufferGeometry().setFromPoints(pipePoints3);
    var pipe3 = new THREE.LineSegments(pipeGeom3, lineMat);
    scene.add(pipe3);
  }

  function initparticles() {
    particles = [];
  }

  function updateparticles(delta) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.position.add(p.velocity);
      p.life -= delta;
      if (p.life <= 0) {
        scene.remove(p);
        particles.splice(i, 1);
      }
    }
  }

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;

    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 200, 400);

    var light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(50, 80, 50);
    light1.shadow.mapSize.width = 2048;
    light1.shadow.mapSize.height = 2048;
    light1.castShadow = true;
    scene.add(light1);

    var light2 = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light2);

    var groundGeom = new THREE.BoxGeometry(200, 0.5, 200);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.9 });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);

    buildStorageTanks();
    buildLoadingTerminal();
    buildPipelineManifold();
    buildBurningTank();
    buildBermWalls();
    buildControlRoom();
    buildPumpStation();
    buildUndergroundPipes();

    initparticles();
  }

  function update(delta) {
    updateparticles(delta);

    tanks.forEach(function(tank) {
      tank.rotation.y += 0.001;
    });

    structures.forEach(function(struct) {
      if (struct.material && struct.material.emissive) {
        var emissiveIntensity = 0.3 + 0.2 * Math.sin(Date.now() * 0.003);
        struct.material.emissiveIntensity = emissiveIntensity;
      }
    });
  }

  function reset() {
    particles.forEach(function(p) {
      scene.remove(p);
    });
    particles = [];

    tanks.forEach(function(tank) {
      tank.rotation.y = 0;
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
