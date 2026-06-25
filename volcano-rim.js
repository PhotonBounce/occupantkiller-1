window.VolcanoRim = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var rimMeshes = [];
  var ashParticles = [];
  var fumaroleVents = [];
  var lavaBombs = [];
  var animationState = {};
  var staticMeshes = [];

  var ashParticleCount = 200;
  var ashFallSpeed = 3.5;
  var ashWaveAmplitude = 0.8;
  var fumaroleParticleSize = 0.3;

  var init = function(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    rimMeshes = [];
    ashParticles = [];
    fumaroleVents = [];
    lavaBombs = [];
    staticMeshes = [];
    animationState.time = 0;
    animationState.ashPhase = 0;
    animationState.lavaPulse = 0;

    buildVolcanoRim();
    buildCalderaView();
    buildFumaroleVents();
    buildResearchStation();
    buildObservationPlatform();
    buildPyroclasticBarrier();
    buildHelicopterLZ();
    buildLavaBombs();
    buildRopeSafety();
    initAshFall();
  };

  var buildVolcanoRim = function() {
    var rimRadius = 120;
    var rimSegments = 32;
    var rimHeight = 8;
    var rimWidth = 20;

    for (var i = 0; i < rimSegments; i++) {
      var angle = (i / rimSegments) * Math.PI * 2;
      var nextAngle = ((i + 1) / rimSegments) * Math.PI * 2;

      var x1 = Math.cos(angle) * rimRadius;
      var z1 = Math.sin(angle) * rimRadius;
      var x2 = Math.cos(nextAngle) * rimRadius;
      var z2 = Math.sin(nextAngle) * rimRadius;

      var rockGeom = new THREE.BoxGeometry(rimWidth, rimHeight, 12);
      var rockMat = new THREE.MeshPhongMaterial({
        color: 0x2a2a2a,
        emissive: 0x0a0a0a,
        shininess: 10
      });
      var rock = new THREE.Mesh(rockGeom, rockMat);

      var midX = (x1 + x2) * 0.5;
      var midZ = (z1 + z2) * 0.5;
      rock.position.set(midX, 15, midZ);

      var rad = Math.atan2(z2 - z1, x2 - x1);
      rock.rotation.y = rad;

      var randomHeight = 2 + Math.random() * 8;
      rock.position.y = 12 + randomHeight;

      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      rimMeshes.push(rock);
      staticMeshes.push(rock);
    }
  };

  var buildCalderaView = function() {
    var calderapitGeom = new THREE.CylinderGeometry(95, 100, 80, 16, 8);
    var calderapitMat = new THREE.MeshPhongMaterial({
      color: 0x1a0a0a,
      emissive: 0x2a1010,
      shininess: 5
    });
    var calderapit = new THREE.Mesh(calderapitGeom, calderapitMat);
    calderapit.position.set(0, -35, 0);
    calderapit.castShadow = true;
    calderapit.receiveShadow = true;
    scene.add(calderapit);
    staticMeshes.push(calderapit);

    for (var i = 0; i < 8; i++) {
      var lavaBlockGeom = new THREE.BoxGeometry(25, 15, 25);
      var lavaBlockMat = new THREE.MeshPhongMaterial({
        color: 0xff6600,
        emissive: 0xff9933,
        shininess: 20
      });
      var lavaBlock = new THREE.Mesh(lavaBlockGeom, lavaBlockMat);

      var angle = (i / 8) * Math.PI * 2;
      lavaBlock.position.set(
        Math.cos(angle) * 50,
        -60,
        Math.sin(angle) * 50
      );
      lavaBlock.scale.y = 0.7;
      lavaBlock.castShadow = true;
      lavaBlock.receiveShadow = true;
      scene.add(lavaBlock);
      staticMeshes.push(lavaBlock);
    }
  };

  var buildFumaroleVents = function() {
    var ventCount = 5;
    for (var i = 0; i < ventCount; i++) {
      var angle = (Math.random() - 0.5) * Math.PI * 0.8;
      var dist = 30 + Math.random() * 50;

      var ventGeom = new THREE.CylinderGeometry(3, 3.5, 2, 8);
      var ventMat = new THREE.MeshPhongMaterial({
        color: 0x444444,
        emissive: 0x222222
      });
      var vent = new THREE.Mesh(ventGeom, ventMat);

      vent.position.set(Math.cos(angle) * dist, 16, Math.sin(angle) * dist);
      vent.castShadow = true;
      vent.receiveShadow = true;
      scene.add(vent);
      staticMeshes.push(vent);

      var gasParticles = [];
      for (var j = 0; j < 6; j++) {
        var gasGeom = new THREE.SphereGeometry(fumaroleParticleSize, 4, 4);
        var gasMat = new THREE.MeshBasicMaterial({
          color: 0xcccccc,
          transparent: true,
          opacity: 0.3
        });
        var gas = new THREE.Mesh(gasGeom, gasMat);
        gas.position.copy(vent.position);
        scene.add(gas);
        gasParticles.push({
          mesh: gas,
          offsetX: (Math.random() - 0.5) * 2,
          offsetZ: (Math.random() - 0.5) * 2,
          phase: Math.random() * Math.PI * 2,
          baseY: vent.position.y
        });
      }

      fumaroleVents.push({
        vent: vent,
        particles: gasParticles,
        phase: Math.random() * Math.PI * 2
      });
    }
  };

  var buildResearchStation = function() {
    var buildingGeom = new THREE.BoxGeometry(20, 12, 18);
    var buildingMat = new THREE.MeshPhongMaterial({
      color: 0xaaaaaa,
      emissive: 0x333333,
      shininess: 15
    });
    var building = new THREE.Mesh(buildingGeom, buildingMat);
    building.position.set(-70, 22, -40);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    staticMeshes.push(building);

    var antennaGeom = new THREE.CylinderGeometry(0.3, 0.3, 16, 6);
    var antennaMat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var antenna = new THREE.Mesh(antennaGeom, antennaMat);
    antenna.position.set(-70, 35, -40);
    antenna.castShadow = true;
    scene.add(antenna);
    staticMeshes.push(antenna);

    var windowGeom = new THREE.BoxGeometry(3, 3, 0.3);
    var windowMat = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      emissive: 0x2244cc
    });
    for (var i = 0; i < 4; i++) {
      var window1 = new THREE.Mesh(windowGeom, windowMat);
      window1.position.set(
        -60 + i * 5,
        24,
        -31
      );
      scene.add(window1);
      staticMeshes.push(window1);
    }
  };

  var buildObservationPlatform = function() {
    var platformGeom = new THREE.BoxGeometry(30, 1.5, 25);
    var platformMat = new THREE.MeshPhongMaterial({
      color: 0x666666,
      emissive: 0x1a1a1a
    });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(50, 18, 60);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    staticMeshes.push(platform);

    var railGeom = new THREE.BoxGeometry(30, 0.8, 0.5);
    var railMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var rail = new THREE.Mesh(railGeom, railMat);
    rail.position.set(50, 19.5, 48);
    rail.castShadow = true;
    scene.add(rail);
    staticMeshes.push(rail);
  };

  var buildPyroclasticBarrier = function() {
    var barrierGeom = new THREE.BoxGeometry(150, 14, 8);
    var barrierMat = new THREE.MeshPhongMaterial({
      color: 0x2a2a2a,
      emissive: 0x0f0f0f
    });
    var barrier = new THREE.Mesh(barrierGeom, barrierMat);
    barrier.position.set(0, 16, -95);
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    scene.add(barrier);
    staticMeshes.push(barrier);

    for (var i = 0; i < 6; i++) {
      var supportGeom = new THREE.BoxGeometry(4, 20, 4);
      var supportMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      var support = new THREE.Mesh(supportGeom, supportMat);
      support.position.set(-50 + i * 20, 8, -95);
      support.castShadow = true;
      scene.add(support);
      staticMeshes.push(support);
    }
  };

  var buildHelicopterLZ = function() {
    var landingGeom = new THREE.BoxGeometry(35, 0.5, 35);
    var landingMat = new THREE.MeshPhongMaterial({
      color: 0x333333,
      emissive: 0x0a0a0a
    });
    var landing = new THREE.Mesh(landingGeom, landingMat);
    landing.position.set(80, 20, -50);
    landing.castShadow = true;
    landing.receiveShadow = true;
    scene.add(landing);
    staticMeshes.push(landing);

    var markerGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 4);
    var markerMat = new THREE.MeshPhongMaterial({ color: 0xff9900 });
    var marker = new THREE.Mesh(markerGeom, markerMat);
    marker.position.set(80, 20.5, -50);
    scene.add(marker);
    staticMeshes.push(marker);

    var windsockGeom = new THREE.CylinderGeometry(1.5, 2, 6, 8);
    var windsockMat = new THREE.MeshPhongMaterial({
      color: 0xff3333,
      emissive: 0xaa0000
    });
    var windsock = new THREE.Mesh(windsockGeom, windsockMat);
    windsock.position.set(100, 18, -50);
    windsock.rotation.z = 0.4;
    windsock.castShadow = true;
    scene.add(windsock);
    staticMeshes.push(windsock);
  };

  var buildLavaBombs = function() {
    var bombCount = 12;
    for (var i = 0; i < bombCount; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = 40 + Math.random() * 80;

      var craterGeom = new THREE.CylinderGeometry(5, 6, 1.5, 8);
      var craterMat = new THREE.MeshPhongMaterial({
        color: 0x3a3a3a,
        emissive: 0x1a1a1a
      });
      var crater = new THREE.Mesh(craterGeom, craterMat);
      crater.position.set(Math.cos(angle) * dist, 14.5, Math.sin(angle) * dist);
      crater.castShadow = true;
      crater.receiveShadow = true;
      scene.add(crater);
      staticMeshes.push(crater);

      var blobGeom = new THREE.SphereGeometry(2.5, 6, 6);
      var blobMat = new THREE.MeshPhongMaterial({
        color: 0xff5500,
        emissive: 0xff7700,
        shininess: 25
      });
      var blob = new THREE.Mesh(blobGeom, blobMat);
      blob.position.set(
        Math.cos(angle) * dist,
        17,
        Math.sin(angle) * dist
      );
      blob.scale.set(0.8 + Math.random() * 0.6, 0.6 + Math.random() * 0.5, 0.8 + Math.random() * 0.6);
      blob.castShadow = true;
      scene.add(blob);

      lavaBombs.push({
        blob: blob,
        baseEmissive: 0xff7700,
        phase: Math.random() * Math.PI * 2
      });
    }
  };

  var buildRopeSafety = function() {
    var ropeCount = 8;
    for (var i = 0; i < ropeCount; i++) {
      var angle = (i / ropeCount) * Math.PI * 2;
      var x1 = Math.cos(angle) * 110;
      var z1 = Math.sin(angle) * 110;
      var x2 = Math.cos(angle) * 105;
      var z2 = Math.sin(angle) * 105;

      var ropeGeom = new THREE.BufferGeometry();
      var positions = new Float32Array([
        x1, 18, z1,
        x2, 16, z2
      ]);
      ropeGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      var ropeMat = new THREE.LineBasicMaterial({ color: 0xffcc00, linewidth: 2 });
      var rope = new THREE.LineSegments(ropeGeom, ropeMat);
      scene.add(rope);
      staticMeshes.push(rope);

      var anchorGeom = new THREE.SphereGeometry(0.8, 4, 4);
      var anchorMat = new THREE.MeshPhongMaterial({ color: 0xccaa00 });
      var anchor = new THREE.Mesh(anchorGeom, anchorMat);
      anchor.position.set(x1, 18, z1);
      anchor.castShadow = true;
      scene.add(anchor);
      staticMeshes.push(anchor);
    }
  };

  var initAshFall = function() {
    for (var i = 0; i < ashParticleCount; i++) {
      var ashGeom = new THREE.SphereGeometry(0.4, 3, 3);
      var ashMat = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.4
      });
      var ash = new THREE.Mesh(ashGeom, ashMat);

      ash.position.set(
        (Math.random() - 0.5) * 300,
        100 + Math.random() * 50,
        (Math.random() - 0.5) * 300
      );

      scene.add(ash);
      ashParticles.push({
        mesh: ash,
        baseY: ash.position.y,
        wave: Math.random() * Math.PI * 2,
        horizontalSpeed: 0.3 + Math.random() * 0.5
      });
    }
  };

  var update = function(delta) {
    animationState.time += delta;
    animationState.ashPhase += delta * ashFallSpeed;
    animationState.lavaPulse += delta * 2;

    for (var i = 0; i < ashParticles.length; i++) {
      var particle = ashParticles[i];
      particle.mesh.position.y = particle.baseY - animationState.ashPhase;

      var waveOffset = Math.sin(animationState.ashPhase * 0.5 + particle.wave) * ashWaveAmplitude;
      particle.mesh.position.x += waveOffset * 0.01;

      if (particle.mesh.position.y < -50) {
        particle.mesh.position.y = particle.baseY;
        particle.mesh.position.x = (Math.random() - 0.5) * 300;
        particle.mesh.position.z = (Math.random() - 0.5) * 300;
      }
    }

    for (var j = 0; j < fumaroleVents.length; j++) {
      var ventData = fumaroleVents[j];
      var ventPos = ventData.vent.position;

      for (var k = 0; k < ventData.particles.length; k++) {
        var gasParticle = ventData.particles[k];
        var phase = animationState.time * 1.5 + gasParticle.phase;

        gasParticle.mesh.position.x = ventPos.x + gasParticle.offsetX * Math.sin(phase);
        gasParticle.mesh.position.y = ventPos.y + Math.sin(phase * 0.7) * 3;
        gasParticle.mesh.position.z = ventPos.z + gasParticle.offsetZ * Math.cos(phase);

        var distFromBase = gasParticle.mesh.position.y - gasParticle.baseY;
        var opacityFade = Math.max(0, 1 - distFromBase / 8);
        gasParticle.mesh.material.opacity = 0.3 * opacityFade;
      }
    }

    for (var l = 0; l < lavaBombs.length; l++) {
      var bomb = lavaBombs[l];
      var pulseValue = 0.5 + Math.sin(animationState.lavaPulse + bomb.phase) * 0.5;
      var pulseColor = new THREE.Color(bomb.baseEmissive);
      pulseColor.multiplyScalar(pulseValue);
      bomb.blob.material.emissive.copy(pulseColor);
    }
  };

  var reset = function() {
    for (var i = 0; i < staticMeshes.length; i++) {
      scene.remove(staticMeshes[i]);
    }
    for (var j = 0; j < ashParticles.length; j++) {
      scene.remove(ashParticles[j].mesh);
    }
    for (var k = 0; k < fumaroleVents.length; k++) {
      var vent = fumaroleVents[k];
      for (var l = 0; l < vent.particles.length; l++) {
        scene.remove(vent.particles[l].mesh);
      }
    }

    rimMeshes = [];
    ashParticles = [];
    fumaroleVents = [];
    lavaBombs = [];
    staticMeshes = [];
    animationState = {};
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
