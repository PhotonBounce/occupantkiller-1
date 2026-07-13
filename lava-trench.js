window.LavaTrench = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var lavaParticles = [];
  var geysers = [];
  var bridges = [];
  var platforms = [];
  var fortifications = [];
  var lavaFlowOffset = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    lavaParticles = [];
    geysers = [];
    bridges = [];
    platforms = [];
    fortifications = [];
    lavaFlowOffset = 0;

    buildTrench();
    buildLava();
    buildGeysers();
    buildBridges();
    buildPlatforms();
    buildFortifications();
  }

  function buildTrench() {
    var trenchWidth = 80;
    var trenchLength = 150;
    var trenchDepth = 60;

    var leftWallGeo = new THREE.BoxGeometry(15, trenchDepth, trenchLength);
    var wallMat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a, shininess: 20 });
    var leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-trenchWidth / 2 - 7.5, -trenchDepth / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    var rightWallGeo = new THREE.BoxGeometry(15, trenchDepth, trenchLength);
    var rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.position.set(trenchWidth / 2 + 7.5, -trenchDepth / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
  }

  function buildLava() {
    var lavaGeo = new THREE.CylinderGeometry(2, 2.5, 0.5, 12);
    var lavaMat = new THREE.MeshPhongMaterial({
      color: 0xff4500,
      emissive: 0xff6600,
      shininess: 100
    });

    for (var i = 0; i < 40; i++) {
      var x = (Math.random() - 0.5) * 70;
      var z = (Math.random() - 0.5) * 120;
      var y = -45;

      var particle = new THREE.Mesh(lavaGeo, lavaMat);
      particle.position.set(x, y, z);
      particle.scale.set(0.8 + Math.random() * 0.4, 0.3, 0.8 + Math.random() * 0.4);
      particle.castShadow = true;

      var velX = (Math.random() - 0.5) * 0.02;
      var velZ = Math.random() * 0.01 + 0.005;

      particle.userData.vx = velX;
      particle.userData.vz = velZ;
      particle.userData.life = Math.random() * 100 + 50;

      lavaParticles.push(particle);
      scene.add(particle);
    }
  }

  function buildGeysers() {
    var geyserPositions = [
      { x: -20, z: -30 },
      { x: 15, z: 20 },
      { x: -35, z: 50 },
      { x: 25, z: -60 }
    ];

    for (var i = 0; i < geyserPositions.length; i++) {
      var pos = geyserPositions[i];
      var ventGeo = new THREE.CylinderGeometry(3, 4, 1, 16);
      var ventMat = new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 10 });
      var vent = new THREE.Mesh(ventGeo, ventMat);
      vent.position.set(pos.x, -44, pos.z);
      vent.castShadow = true;
      scene.add(vent);

      geysers.push({
        position: pos,
        ejectVelocity: 0.8 + Math.random() * 0.4,
        frequency: 3 + Math.random() * 2,
        timer: Math.random() * 5
      });
    }
  }

  function buildBridges() {
    var bridgeMain = {
      x: 0,
      z: 0,
      length: 50,
      width: 12
    };

    var mainBeamGeo = new THREE.BoxGeometry(bridgeMain.width, 2, bridgeMain.length);
    var steelMat = new THREE.MeshPhongMaterial({ color: 0xcc7722, shininess: 60 });
    var mainBeam = new THREE.Mesh(mainBeamGeo, steelMat);
    mainBeam.position.set(0, -25, 0);
    mainBeam.castShadow = true;
    mainBeam.receiveShadow = true;
    scene.add(mainBeam);

    for (var i = 0; i < 8; i++) {
      var supportGeo = new THREE.CylinderGeometry(0.8, 1, 15, 8);
      var support = new THREE.Mesh(supportGeo, steelMat);
      var xPos = -20 + i * 7;
      support.position.set(xPos, -32.5, 0);
      support.castShadow = true;
      scene.add(support);
    }

    var railGeo = new THREE.BoxGeometry(0.5, 1.5, bridgeMain.length);
    var railMat = new THREE.MeshPhongMaterial({ color: 0x885533, shininess: 30 });
    var leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-bridgeMain.width / 2 - 1, -23, 0);
    scene.add(leftRail);

    var rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(bridgeMain.width / 2 + 1, -23, 0);
    scene.add(rightRail);

    bridges.push(mainBeam);
  }

  function buildPlatforms() {
    var platformConfigs = [
      { x: -30, z: -40, size: 6, height: -15 },
      { x: 25, z: -20, size: 5, height: -20 },
      { x: -40, z: 30, size: 7, height: -18 },
      { x: 30, z: 45, size: 5, height: -22 },
      { x: 0, z: -70, size: 8, height: -12 }
    ];

    for (var i = 0; i < platformConfigs.length; i++) {
      var cfg = platformConfigs[i];
      var platformGeo = new THREE.BoxGeometry(cfg.size, 2, cfg.size);
      var rockMat = new THREE.MeshPhongMaterial({ color: 0x664422, shininess: 15 });
      var platform = new THREE.Mesh(platformGeo, rockMat);
      platform.position.set(cfg.x, cfg.height, cfg.z);
      platform.rotation.z = (Math.random() - 0.5) * 0.3;
      platform.castShadow = true;
      platform.receiveShadow = true;
      scene.add(platform);
      platforms.push(platform);
    }
  }

  function buildFortifications() {
    var leftFortX = -50;
    var rightFortX = 50;

    for (var side = 0; side < 2; side++) {
      var fortX = side === 0 ? leftFortX : rightFortX;

      var wallGeo = new THREE.BoxGeometry(20, 8, 15);
      var fortMat = new THREE.MeshPhongMaterial({ color: 0x555555, shininess: 10 });
      var fortWall = new THREE.Mesh(wallGeo, fortMat);
      fortWall.position.set(fortX, -22, -20);
      fortWall.castShadow = true;
      fortWall.receiveShadow = true;
      scene.add(fortWall);

      for (var t = 0; t < 3; t++) {
        var towerGeo = new THREE.CylinderGeometry(2.5, 3, 12, 8);
        var tower = new THREE.Mesh(towerGeo, fortMat);
        var zOffset = -30 + t * 15;
        tower.position.set(fortX - 8 + t * 8, -16, zOffset);
        tower.castShadow = true;
        scene.add(tower);
        fortifications.push(tower);
      }
    }
  }

  function update(delta) {
    updateLavaParticles(delta);
    updateGeysers(delta);
    updateLavaFlow(delta);
  }

  function updateLavaParticles(delta) {
    for (var i = lavaParticles.length - 1; i >= 0; i--) {
      var particle = lavaParticles[i];
      particle.position.x += particle.userData.vx;
      particle.position.z += particle.userData.vz;
      particle.userData.life -= delta;

      var boundsX = 40;
      var boundsZ = 75;
      if (Math.abs(particle.position.x) > boundsX || Math.abs(particle.position.z) > boundsZ) {
        particle.position.x = (Math.random() - 0.5) * 70;
        particle.position.z = (Math.random() - 0.5) * 120;
        particle.userData.life = 100;
      }

      var flickerIntensity = 0.7 + Math.sin(particle.userData.life * 0.05) * 0.3;
      particle.material.emissive.setHex(Math.floor(0xff6600 * flickerIntensity));
    }
  }

  function updateGeysers(delta) {
    for (var i = 0; i < geysers.length; i++) {
      var geyser = geysers[i];
      geyser.timer -= delta;

      if (geyser.timer <= 0) {
        ejectGeyserParticles(geyser);
        geyser.timer = geyser.frequency;
      }
    }
  }

  function ejectGeyserParticles(geyser) {
    for (var i = 0; i < 8; i++) {
      var particleGeo = new THREE.SphereGeometry(0.6, 4, 4);
      var particleMat = new THREE.MeshPhongMaterial({
        color: 0xff5533,
        emissive: 0xff4400
      });
      var particle = new THREE.Mesh(particleGeo, particleMat);
      particle.position.set(geyser.position.x, -44, geyser.position.z);

      var angle = (Math.PI * 2 / 8) * i;
      var spreadVel = 0.3;
      particle.userData.vx = Math.cos(angle) * spreadVel;
      particle.userData.vy = 0.6 + Math.random() * 0.4;
      particle.userData.vz = Math.sin(angle) * spreadVel;
      particle.userData.life = 2.5;

      scene.add(particle);
      lavaParticles.push(particle);
    }
  }

  function updateLavaFlow(delta) {
    lavaFlowOffset += delta * 0.1;
  }

  function reset() {
    for (var i = lavaParticles.length - 1; i >= 0; i--) {
      scene.remove(lavaParticles[i]);
    }
    lavaParticles = [];
    geysers = [];
    bridges = [];
    platforms = [];
    fortifications = [];
    lavaFlowOffset = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
