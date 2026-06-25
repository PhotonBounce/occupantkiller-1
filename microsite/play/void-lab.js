window.VoidLab = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var portalSphere = null;
  var debrisParticles = [];
  var realityTears = [];
  var containmentBeams = [];
  var labWalls = [];
  var floatingObjects = [];
  var voidTime = 0;
  var particleSpeed = 0.05;

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    voidTime = 0;

    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.Fog(0x0a0a0f, 80, 200);

    buildPortal();
    buildRealityTears();
    buildContainmentBeams();
    buildLabWalls();
    buildFloatingDebris();
    buildGravityAnomalies();
  }

  function buildPortal() {
    var geometry = new THREE.SphereGeometry(8, 32, 32);
    var material = new THREE.MeshStandardMaterial({
      color: 0x1a0033,
      emissive: 0x330066,
      metalness: 0.9,
      roughness: 0.1
    });
    portalSphere = new THREE.Mesh(geometry, material);
    portalSphere.position.set(0, 15, -20);
    scene.add(portalSphere);

    var glowGeometry = new THREE.SphereGeometry(8.5, 32, 32);
    var glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x6600ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    var glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(portalSphere.position);
    scene.add(glowMesh);
  }

  function buildRealityTears() {
    var directions = [
      new THREE.Vector3(1, 0.5, 0),
      new THREE.Vector3(-1, 0.3, -0.5),
      new THREE.Vector3(0.5, -0.5, 1),
      new THREE.Vector3(-0.7, 0.8, 0.3),
      new THREE.Vector3(0.3, -0.2, -1),
      new THREE.Vector3(1, -0.6, 0.5)
    ];

    directions.forEach(function(dir) {
      dir.normalize();
      var points = [];
      points.push(new THREE.Vector3(0, 15, -20));
      var endPos = new THREE.Vector3(0, 15, -20).add(dir.multiplyScalar(35));
      points.push(endPos);

      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({
        color: 0x9933ff,
        linewidth: 2,
        transparent: true,
        opacity: 0.6
      });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      realityTears.push({
        line: line,
        direction: dir,
        length: 35
      });
    });
  }

  function buildContainmentBeams() {
    var positions = [
      new THREE.Vector3(-12, 0, -10),
      new THREE.Vector3(12, 0, -10),
      new THREE.Vector3(-12, 0, -30),
      new THREE.Vector3(12, 0, -30)
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(1, 1, 20, 16);
      var material = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        metalness: 0.7,
        roughness: 0.2
      });
      var beam = new THREE.Mesh(geometry, material);
      beam.position.copy(pos);
      beam.position.y = 10;
      scene.add(beam);
      containmentBeams.push(beam);
    });
  }

  function buildLabWalls() {
    var leftWall = new THREE.BoxGeometry(30, 25, 1);
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x333344,
      metalness: 0.3,
      roughness: 0.7
    });
    var leftMesh = new THREE.Mesh(leftWall, wallMat);
    leftMesh.position.set(-20, 12.5, 0);
    scene.add(leftMesh);
    labWalls.push(leftMesh);

    var rightWall = new THREE.BoxGeometry(30, 25, 1);
    var rightMesh = new THREE.Mesh(rightWall, wallMat);
    rightMesh.position.set(20, 12.5, 0);
    scene.add(rightMesh);
    labWalls.push(rightMesh);

    var backWall = new THREE.BoxGeometry(40, 25, 1);
    var backMesh = new THREE.Mesh(backWall, wallMat);
    backMesh.position.set(0, 12.5, -35);
    scene.add(backMesh);
    labWalls.push(backMesh);
  }

  function buildFloatingDebris() {
    var debrisCount = 20;
    for (var i = 0; i < debrisCount; i++) {
      var size = 0.3 + Math.random() * 0.8;
      var geometry = new THREE.SphereGeometry(size, 8, 8);
      var material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.3 + 0.6, 0.8, 0.5),
        metalness: 0.6,
        roughness: 0.4
      });
      var debris = new THREE.Mesh(geometry, material);
      debris.position.set(
        (Math.random() - 0.5) * 30,
        5 + Math.random() * 20,
        (Math.random() - 0.5) * 25
      );
      scene.add(debris);
      debrisParticles.push({
        mesh: debris,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05
        ),
        basePos: debris.position.clone(),
        orbitPhase: Math.random() * Math.PI * 2
      });
    }
  }

  function buildGravityAnomalies() {
    var anomalyPositions = [
      new THREE.Vector3(-15, 8, -15),
      new THREE.Vector3(15, 8, -15),
      new THREE.Vector3(0, 6, -5)
    ];

    anomalyPositions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      var material = new THREE.MeshStandardMaterial({
        color: 0x4a5566,
        metalness: 0.4,
        roughness: 0.6
      });
      var box = new THREE.Mesh(geometry, material);
      box.position.copy(pos);
      box.rotation.set(
        Math.random() * 0.5,
        Math.random() * 0.5,
        Math.random() * 0.5
      );
      scene.add(box);
      floatingObjects.push({
        mesh: box,
        baseRotation: box.rotation.clone(),
        anomalyCenter: pos.clone(),
        distance: 3 + Math.random() * 2
      });
    });
  }

  function update(delta) {
    voidTime += delta;

    if (portalSphere) {
      portalSphere.rotation.x += delta * 0.3;
      portalSphere.rotation.y += delta * 0.2;
      var pulseScale = 0.95 + Math.sin(voidTime * 2) * 0.05;
      portalSphere.scale.set(pulseScale, pulseScale, pulseScale);
      portalSphere.material.emissiveIntensity = 0.5 + Math.sin(voidTime) * 0.3;
    }

    debrisParticles.forEach(function(particle) {
      particle.orbitPhase += delta * 0.8;
      var orbitX = Math.cos(particle.orbitPhase) * 12;
      var orbitY = Math.sin(particle.orbitPhase * 0.7) * 8;
      var orbitZ = Math.sin(particle.orbitPhase * 0.5) * 10;
      particle.mesh.position.set(orbitX, orbitY + 12, orbitZ - 15);
      particle.mesh.rotation.x += delta * 1.2;
      particle.mesh.rotation.y += delta * 0.8;
    });

    realityTears.forEach(function(tear) {
      tear.line.material.opacity = 0.4 + Math.sin(voidTime * 3) * 0.2;
    });

    containmentBeams.forEach(function(beam) {
      beam.material.emissiveIntensity = 0.6 + Math.sin(voidTime * 2.5) * 0.4;
    });

    floatingObjects.forEach(function(obj) {
      var offsetX = Math.cos(voidTime * 1.5) * obj.distance;
      var offsetZ = Math.sin(voidTime * 1.2) * obj.distance;
      obj.mesh.position.set(
        obj.anomalyCenter.x + offsetX,
        obj.anomalyCenter.y,
        obj.anomalyCenter.z + offsetZ
      );
      obj.mesh.rotation.x = obj.baseRotation.x + Math.sin(voidTime) * 0.3;
      obj.mesh.rotation.y = obj.baseRotation.y + voidTime * 0.5;
      obj.mesh.rotation.z = obj.baseRotation.z + Math.cos(voidTime * 0.8) * 0.2;
    });
  }

  function reset() {
    voidTime = 0;
    debrisParticles.forEach(function(particle) {
      particle.orbitPhase = Math.random() * Math.PI * 2;
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
