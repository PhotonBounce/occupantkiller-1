window.BlackMarch = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var spotlights = [];
  var smokeParticles = [];
  var time = 0;

  function init(sc, cam) {
    scene = sc;
    camera = cam;
    meshes = [];
    spotlights = [];
    smokeParticles = [];

    buildGround();
    buildReviewingStands();
    buildCentralPodium();
    buildPropagandaBanners();
    buildSpotlightTowers();
    buildVehicleRubble();
    buildSmokeEmitters();

    scene.background = new THREE.Color(0x0a0a0a);
    var ambientLight = new THREE.AmbientLight(0x333333, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x666666, 0.4);
    directionalLight.position.set(50, 80, 50);
    scene.add(directionalLight);
  }

  function buildGround() {
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var groundGeom = new THREE.BoxGeometry(200, 1, 200);
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -1;
    scene.add(ground);
    meshes.push(ground);

    for (var i = 0; i < 15; i++) {
      var crackGeom = new THREE.BoxGeometry(
        8 + Math.random() * 6,
        0.8,
        6 + Math.random() * 8
      );
      var crackMat = new THREE.MeshLambertMaterial({ color: 0x0d0d0d });
      var crack = new THREE.Mesh(crackGeom, crackMat);
      crack.position.set(
        -80 + Math.random() * 160,
        -0.5,
        -80 + Math.random() * 160
      );
      crack.rotation.z = Math.random() * 0.3;
      scene.add(crack);
      meshes.push(crack);
    }
  }

  function buildReviewingStands() {
    var standMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var stepHeight = 2;
    var stepWidth = 60;

    for (var i = 0; i < 4; i++) {
      var tieredGeom = new THREE.BoxGeometry(stepWidth - i * 10, stepHeight, 35 - i * 6);
      var tiered = new THREE.Mesh(tieredGeom, standMat);
      tiered.position.set(-70, 2 + i * stepHeight, 0);
      scene.add(tiered);
      meshes.push(tiered);

      var blastMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
      var blastGeom = new THREE.BoxGeometry(8, stepHeight - 0.5, 6);
      var blastCrater = new THREE.Mesh(blastGeom, blastMat);
      blastCrater.position.set(-70 + Math.random() * 20, 2 + i * stepHeight + 1, Math.random() * 15);
      scene.add(blastCrater);
      meshes.push(blastCrater);
    }

    for (var j = 0; j < 4; j++) {
      var tieredGeom2 = new THREE.BoxGeometry(stepWidth - j * 10, stepHeight, 35 - j * 6);
      var tiered2 = new THREE.Mesh(tieredGeom2, standMat);
      tiered2.position.set(70, 2 + j * stepHeight, 0);
      scene.add(tiered2);
      meshes.push(tiered2);
    }
  }

  function buildCentralPodium() {
    var podiumGeom = new THREE.CylinderGeometry(20, 20, 3, 32);
    var podiumMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var podium = new THREE.Mesh(podiumGeom, podiumMat);
    podium.position.y = 1.5;
    scene.add(podium);
    meshes.push(podium);

    var burnMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    for (var i = 0; i < 8; i++) {
      var burnGeom = new THREE.SphereGeometry(2 + Math.random() * 2, 8, 8);
      var burn = new THREE.Mesh(burnGeom, burnMat);
      burn.position.set(
        Math.cos(i * Math.PI / 4) * 12,
        2.5,
        Math.sin(i * Math.PI / 4) * 12
      );
      scene.add(burn);
      meshes.push(burn);
    }
  }

  function buildPropagandaBanners() {
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var poleX = Math.cos(angle) * 60;
      var poleZ = Math.sin(angle) * 60;

      var poleGeom = new THREE.CylinderGeometry(0.8, 0.8, 25, 12);
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(poleX, 12.5, poleZ);
      scene.add(pole);
      meshes.push(pole);

      var bannerPoints = [
        new THREE.Vector3(poleX, 20, poleZ),
        new THREE.Vector3(poleX + 8, 20, poleZ),
        new THREE.Vector3(poleX + 8, 16, poleZ),
        new THREE.Vector3(poleX, 16, poleZ)
      ];
      var bannerGeom = new THREE.BufferGeometry().setFromPoints(bannerPoints);
      var bannerMat = new THREE.LineBasicMaterial({ color: 0x8b0000, linewidth: 2 });
      var bannerLines = new THREE.LineSegments(bannerGeom, bannerMat);
      scene.add(bannerLines);
      meshes.push(bannerLines);
    }
  }

  function buildSpotlightTowers() {
    for (var i = 0; i < 4; i++) {
      var posX = (i < 2 ? -1 : 1) * 75;
      var posZ = (i % 2 === 0 ? -1 : 1) * 85;

      var towerGeom = new THREE.CylinderGeometry(1.5, 1.5, 35, 12);
      var towerMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var tower = new THREE.Mesh(towerGeom, towerMat);
      tower.position.set(posX, 17.5, posZ);
      scene.add(tower);
      meshes.push(tower);

      var coneGeom = new THREE.ConeGeometry(3, 4, 16);
      var coneMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var cone = new THREE.Mesh(coneGeom, coneMat);
      cone.position.set(posX, 36, posZ);
      cone.rotation.x = Math.PI / 2;
      scene.add(cone);
      meshes.push(cone);

      spotlights.push({
        x: posX,
        z: posZ,
        angle: i
      });
    }
  }

  function buildVehicleRubble() {
    var vehiclePositions = [
      { x: -30, z: 40 },
      { x: 35, z: -50 },
      { x: 20, z: 30 }
    ];

    vehiclePositions.forEach(function(pos) {
      var bodyGeom = new THREE.BoxGeometry(8, 3, 15);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x0d0d0d });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(pos.x, 1.5, pos.z);
      body.rotation.z = 0.2 + Math.random() * 0.3;
      scene.add(body);
      meshes.push(body);

      for (var i = 0; i < 2; i++) {
        var wheelGeom = new THREE.CylinderGeometry(1.5, 1.5, 1.2, 16);
        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(pos.x - 3 + i * 6, 1.5, pos.z + 5);
        wheel.rotation.z = Math.PI / 2;
        scene.add(wheel);
        meshes.push(wheel);
      }

      var turretGeom = new THREE.CylinderGeometry(2, 2.2, 2, 12);
      var turretMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var turret = new THREE.Mesh(turretGeom, turretMat);
      turret.position.set(pos.x, 3.5, pos.z);
      scene.add(turret);
      meshes.push(turret);
    });
  }

  function buildSmokeEmitters() {
    smokeParticles = [
      { x: 35, z: -50, life: 0 },
      { x: 20, z: 30, life: 0.3 },
      { x: -30, z: 40, life: 0.6 }
    ];

    smokeParticles.forEach(function(particle) {
      var smokeGeom = new THREE.SphereGeometry(8, 8, 8);
      var smokeMat = new THREE.MeshLambertMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.2
      });
      var smoke = new THREE.Mesh(smokeGeom, smokeMat);
      smoke.position.set(particle.x, 15, particle.z);
      scene.add(smoke);
      particle.mesh = smoke;
    });
  }

  function update(delta) {
    time += delta;

    spotlights.forEach(function(spotlight, idx) {
      var swayAngle = time * 0.3 + spotlight.angle;
      var sweepDir = Math.sin(swayAngle) * 0.4;
      var coneIndex = idx + meshes.length - 4;
      if (meshes[coneIndex]) {
        meshes[coneIndex].rotation.y = sweepDir;
      }
    });

    smokeParticles.forEach(function(particle) {
      particle.life += delta;
      if (particle.life > 2) {
        particle.life = 0;
      }
      if (particle.mesh) {
        var scale = 0.8 + Math.sin(particle.life * Math.PI) * 0.3;
        particle.mesh.scale.set(scale, scale, scale);
        particle.mesh.position.y = 15 + Math.sin(particle.life * 2) * 3;
        var opacity = Math.max(0, 1 - particle.life / 2) * 0.2;
        particle.mesh.material.opacity = opacity;
      }
    });

    meshes.forEach(function(mesh) {
      if (mesh.position.y < -10) {
        mesh.position.y = -10;
      }
    });
  }

  function reset() {
    meshes.forEach(function(mesh) {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });

    smokeParticles.forEach(function(particle) {
      if (particle.mesh) {
        scene.remove(particle.mesh);
        if (particle.mesh.geometry) particle.mesh.geometry.dispose();
        if (particle.mesh.material) particle.mesh.material.dispose();
      }
    });

    meshes = [];
    smokeParticles = [];
    time = 0;
    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
