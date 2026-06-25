window.TrenchAssault = (function() {
  'use strict';

  var scene;
  var camera;
  var trenchMaterial;
  var sandbagMaterial;
  var wireMaterial;
  var terrainMaterial;
  var woodMaterial;
  var metalMaterial;
  var mudMaterial;
  var signalFlare;
  var signalFlareLight;
  var flareActive;
  var flareTime;
  var signalFlareGroup;
  var artilleryGroup;
  var artillerySmokeParticles;
  var observationBalloon;
  var balloonSwayAngle;
  var balloonSwayDirection;

  var init = function(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    flareActive = false;
    flareTime = 0;
    balloonSwayAngle = 0;
    balloonSwayDirection = 1;
    artillerySmokeParticles = [];

    createMaterials();
    buildTerrainBase();
    buildTrenchNetwork();
    buildSandbagWalls();
    buildBarbedWireBarriers();
    buildShellCraters();
    buildDugoutShelters();
    buildArtilleryBattery();
    buildMudAndPuddles();
    buildSupplyTrench();
    buildObservationBalloon();
    buildBattlefieldDebris();
    buildSignalFlareSystem();
  };

  var createMaterials = function() {
    trenchMaterial = new THREE.MeshPhongMaterial({ color: 0x3d3428, shininess: 10 });
    sandbagMaterial = new THREE.MeshPhongMaterial({ color: 0xc2a878, shininess: 5 });
    wireMaterial = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    terrainMaterial = new THREE.MeshPhongMaterial({ color: 0x5a4a3a, shininess: 0 });
    woodMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3628, shininess: 8 });
    metalMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, shininess: 30 });
    mudMaterial = new THREE.MeshPhongMaterial({ color: 0x3a2a1a, shininess: 0 });
  };

  var buildTerrainBase = function() {
    var terrainGeometry = new THREE.BoxGeometry(200, 2, 200);
    var terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.position.y = -15;
    terrain.castShadow = true;
    terrain.receiveShadow = true;
    scene.add(terrain);
  };

  var buildTrenchNetwork = function() {
    var trenchPositions = [
      { x: 0, z: -40 },
      { x: 0, z: 0 },
      { x: 0, z: 40 },
      { x: 30, z: -30 },
      { x: 30, z: 10 },
      { x: -30, z: -20 },
      { x: -30, z: 30 }
    ];

    for (var i = 0; i < trenchPositions.length; i++) {
      var pos = trenchPositions[i];
      var length = (i % 3 === 0) ? 80 : 50;
      var trenchGeometry = new THREE.BoxGeometry(length, 12, 6);
      var trench = new THREE.Mesh(trenchGeometry, trenchMaterial);
      trench.position.set(pos.x, -5, pos.z);
      trench.castShadow = true;
      trench.receiveShadow = true;
      scene.add(trench);
    }
  };

  var buildSandbagWalls = function() {
    var sandbagPositions = [
      { x: -8, z: -40 },
      { x: 8, z: -40 },
      { x: -8, z: 0 },
      { x: 8, z: 0 },
      { x: -8, z: 40 },
      { x: 8, z: 40 },
      { x: 30, z: -35 },
      { x: 30, z: 15 },
      { x: -35, z: -20 },
      { x: -35, z: 35 }
    ];

    for (var i = 0; i < sandbagPositions.length; i++) {
      var pos = sandbagPositions[i];
      for (var row = 0; row < 3; row++) {
        var bagGeometry = new THREE.BoxGeometry(4, 3, 4);
        var bag = new THREE.Mesh(bagGeometry, sandbagMaterial);
        bag.position.set(pos.x, 1 + row * 3, pos.z);
        bag.castShadow = true;
        bag.receiveShadow = true;
        scene.add(bag);
      }
    }
  };

  var buildBarbedWireBarriers = function() {
    var wireBarriers = [
      { start: { x: -15, z: -50 }, end: { x: 15, z: -50 } },
      { start: { x: -50, z: -10 }, end: { x: -50, z: 50 } },
      { start: { x: 50, z: -20 }, end: { x: 50, z: 40 } },
      { start: { x: -20, z: 55 }, end: { x: 30, z: 55 } }
    ];

    for (var i = 0; i < wireBarriers.length; i++) {
      var barrier = wireBarriers[i];
      var postStart = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
      var postMeshStart = new THREE.Mesh(postStart, woodMaterial);
      postMeshStart.position.set(barrier.start.x, 2, barrier.start.z);
      postMeshStart.castShadow = true;
      scene.add(postMeshStart);

      var postEnd = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
      var postMeshEnd = new THREE.Mesh(postEnd, woodMaterial);
      postMeshEnd.position.set(barrier.end.x, 2, barrier.end.z);
      postMeshEnd.castShadow = true;
      scene.add(postMeshEnd);

      var wirePoints = [];
      wirePoints.push(new THREE.Vector3(barrier.start.x, 4, barrier.start.z));
      wirePoints.push(new THREE.Vector3(barrier.end.x, 4, barrier.end.z));

      var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
      var wireLine = new THREE.LineSegments(wireGeometry, wireMaterial);
      scene.add(wireLine);

      var dist = Math.sqrt(
        Math.pow(barrier.end.x - barrier.start.x, 2) +
        Math.pow(barrier.end.z - barrier.start.z, 2)
      );
      var segmentCount = Math.floor(dist / 8);
      for (var j = 0; j < segmentCount; j++) {
        var t = j / segmentCount;
        var x = barrier.start.x + (barrier.end.x - barrier.start.x) * t;
        var z = barrier.start.z + (barrier.end.z - barrier.start.z) * t;
        var wireSpike = new THREE.CylinderGeometry(0.15, 0.15, 4, 4);
        var spikeMesh = new THREE.Mesh(wireSpike, metalMaterial);
        spikeMesh.position.set(x, 4, z);
        spikeMesh.castShadow = true;
        scene.add(spikeMesh);
      }
    }
  };

  var buildShellCraters = function() {
    var craterPositions = [
      { x: -35, z: -60 },
      { x: 45, z: -45 },
      { x: 55, z: 20 },
      { x: -55, z: 50 },
      { x: 20, z: 60 }
    ];

    for (var i = 0; i < craterPositions.length; i++) {
      var pos = craterPositions[i];
      var craterSize = 8 + Math.random() * 6;
      var craterDepth = 3 + Math.random() * 2;
      var craterGeometry = new THREE.CylinderGeometry(craterSize, craterSize * 0.7, craterDepth, 12);
      var crater = new THREE.Mesh(craterGeometry, mudMaterial);
      crater.position.set(pos.x, -craterDepth / 2 - 13, pos.z);
      crater.castShadow = true;
      crater.receiveShadow = true;
      scene.add(crater);
    }
  };

  var buildDugoutShelters = function() {
    var dugoutPositions = [
      { x: -15, z: -40 },
      { x: 15, z: 0 },
      { x: -35, z: 30 }
    ];

    for (var i = 0; i < dugoutPositions.length; i++) {
      var pos = dugoutPositions[i];
      var dugoutGeometry = new THREE.BoxGeometry(12, 8, 8);
      var dugout = new THREE.Mesh(dugoutGeometry, trenchMaterial);
      dugout.position.set(pos.x, -1, pos.z);
      dugout.castShadow = true;
      dugout.receiveShadow = true;
      scene.add(dugout);

      var roofGeometry = new THREE.BoxGeometry(14, 2, 10);
      var roof = new THREE.Mesh(roofGeometry, woodMaterial);
      roof.position.set(pos.x, 4, pos.z);
      roof.castShadow = true;
      scene.add(roof);

      for (var j = 0; j < 3; j++) {
        var beamGeometry = new THREE.CylinderGeometry(0.6, 0.6, 6, 8);
        var beam = new THREE.Mesh(beamGeometry, woodMaterial);
        beam.position.set(pos.x - 3 + j * 3, 1, pos.z);
        beam.castShadow = true;
        scene.add(beam);
      }
    }
  };

  var buildArtilleryBattery = function() {
    artilleryGroup = new THREE.Group();

    var platformGeometry = new THREE.BoxGeometry(12, 1, 12);
    var platform = new THREE.Mesh(platformGeometry, metalMaterial);
    platform.position.y = 0;
    platform.castShadow = true;
    platform.receiveShadow = true;
    artilleryGroup.add(platform);

    var cannonBarrelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 20, 12);
    var cannonBarrel = new THREE.Mesh(cannonBarrelGeometry, metalMaterial);
    cannonBarrel.rotation.z = Math.PI / 6;
    cannonBarrel.position.set(0, 3, 0);
    cannonBarrel.castShadow = true;
    artilleryGroup.add(cannonBarrel);

    var breechGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    var breech = new THREE.Mesh(breechGeometry, metalMaterial);
    breech.position.set(0, 2, 0);
    breech.castShadow = true;
    artilleryGroup.add(breech);

    for (var i = 0; i < 2; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(2, 2, 0.8, 16);
      var wheel = new THREE.Mesh(wheelGeometry, metalMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(-5 + i * 10, 0.5, 0);
      wheel.castShadow = true;
      artilleryGroup.add(wheel);
    }

    artilleryGroup.position.set(-40, -13, -50);
    scene.add(artilleryGroup);

    var ammoStackPositions = [
      { x: -5, z: -5 },
      { x: 5, z: -5 },
      { x: 0, z: -10 }
    ];

    for (var j = 0; j < ammoStackPositions.length; j++) {
      var stackPos = ammoStackPositions[j];
      for (var row = 0; row < 4; row++) {
        var shellGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
        var shell = new THREE.Mesh(shellGeometry, metalMaterial);
        shell.position.set(
          -40 + stackPos.x,
          -10 + row * 2.5,
          -50 + stackPos.z
        );
        shell.castShadow = true;
        scene.add(shell);
      }
    }
  };

  var buildMudAndPuddles = function() {
    var puddlePositions = [
      { x: -20, z: -30 },
      { x: 25, z: 10 },
      { x: -45, z: 25 },
      { x: 40, z: -20 },
      { x: 0, z: 45 }
    ];

    for (var i = 0; i < puddlePositions.length; i++) {
      var pos = puddlePositions[i];
      var puddleSize = 4 + Math.random() * 4;
      var puddleGeometry = new THREE.BoxGeometry(puddleSize, 0.3, puddleSize);
      var puddleMaterial = new THREE.MeshPhongMaterial({ color: 0x4a6a7a, shininess: 20 });
      var puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
      puddle.position.set(pos.x, -13.5, pos.z);
      puddle.receiveShadow = true;
      scene.add(puddle);
    }
  };

  var buildSupplyTrench = function() {
    var supplyTrenchGeometry = new THREE.BoxGeometry(6, 10, 60);
    var supplyTrench = new THREE.Mesh(supplyTrenchGeometry, trenchMaterial);
    supplyTrench.position.set(50, -8, -5);
    supplyTrench.castShadow = true;
    supplyTrench.receiveShadow = true;
    scene.add(supplyTrench);

    var ammoPositions = [
      { x: 48, z: -30 },
      { x: 52, z: -10 },
      { x: 48, z: 10 },
      { x: 52, z: 30 }
    ];

    for (var i = 0; i < ammoPositions.length; i++) {
      var pos = ammoPositions[i];
      var crateGeometry = new THREE.BoxGeometry(3, 3, 3);
      var crateMaterial = new THREE.MeshPhongMaterial({ color: 0x5a4a3a, shininess: 5 });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(pos.x, 0, pos.z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
    }
  };

  var buildObservationBalloon = function() {
    observationBalloon = new THREE.Group();

    var balloonGeometry = new THREE.SphereGeometry(5, 16, 16);
    var balloonMaterial = new THREE.MeshPhongMaterial({ color: 0xd4a574, shininess: 15 });
    var balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
    balloon.position.y = 0;
    balloon.castShadow = true;
    observationBalloon.add(balloon);

    var gondolaGeometry = new THREE.BoxGeometry(4, 2, 2);
    var gondolaMaterial = new THREE.MeshPhongMaterial({ color: 0x3a2a1a, shininess: 8 });
    var gondola = new THREE.Mesh(gondolaGeometry, gondolaMaterial);
    gondola.position.y = -7;
    gondola.castShadow = true;
    observationBalloon.add(gondola);

    for (var i = 0; i < 4; i++) {
      var ropePoints = [
        new THREE.Vector3(i < 2 ? -2 : 2, 0, i % 2 === 0 ? -1 : 1),
        new THREE.Vector3(i < 2 ? -1.5 : 1.5, -6.5, i % 2 === 0 ? -0.5 : 0.5)
      ];
      var ropeGeometry = new THREE.BufferGeometry().setFromPoints(ropePoints);
      var ropeLine = new THREE.LineSegments(ropeGeometry, wireMaterial);
      observationBalloon.add(ropeLine);
    }

    observationBalloon.position.set(60, 15, -30);
    scene.add(observationBalloon);
  };

  var buildBattlefieldDebris = function() {
    var debrisPositions = [
      { x: -60, z: -40, type: 'rifle' },
      { x: 35, z: 50, type: 'helmet' },
      { x: -25, z: -55, type: 'equipment' },
      { x: 45, z: 35, type: 'can' },
      { x: -50, z: 20, type: 'beam' }
    ];

    for (var i = 0; i < debrisPositions.length; i++) {
      var pos = debrisPositions[i];
      var debrisMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3a2a, shininess: 3 });

      if (pos.type === 'rifle') {
        var stockGeometry = new THREE.BoxGeometry(0.5, 0.5, 3);
        var stock = new THREE.Mesh(stockGeometry, debrisMaterial);
        stock.position.set(pos.x, -12, pos.z);
        stock.rotation.z = Math.PI / 4;
        stock.castShadow = true;
        scene.add(stock);
      } else if (pos.type === 'helmet') {
        var helmetGeometry = new THREE.SphereGeometry(1, 12, 12);
        var helmet = new THREE.Mesh(helmetGeometry, metalMaterial);
        helmet.position.set(pos.x, -11, pos.z);
        helmet.scale.set(1, 0.6, 1);
        helmet.castShadow = true;
        scene.add(helmet);
      } else if (pos.type === 'equipment') {
        var eqGeometry = new THREE.BoxGeometry(1.5, 1, 1);
        var eq = new THREE.Mesh(eqGeometry, debrisMaterial);
        eq.position.set(pos.x, -12, pos.z);
        eq.castShadow = true;
        scene.add(eq);
      } else if (pos.type === 'can') {
        var canGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 6);
        var can = new THREE.Mesh(canGeometry, metalMaterial);
        can.position.set(pos.x, -12, pos.z);
        can.castShadow = true;
        scene.add(can);
      } else if (pos.type === 'beam') {
        var beamGeometry = new THREE.BoxGeometry(1, 0.5, 4);
        var beamMesh = new THREE.Mesh(beamGeometry, woodMaterial);
        beamMesh.position.set(pos.x, -11, pos.z);
        beamMesh.rotation.z = Math.PI / 6;
        beamMesh.castShadow = true;
        scene.add(beamMesh);
      }
    }
  };

  var buildSignalFlareSystem = function() {
    signalFlareGroup = new THREE.Group();

    var flareGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    var flareMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    signalFlare = new THREE.Mesh(flareGeometry, flareMaterial);
    signalFlare.position.y = 0;
    signalFlareGroup.add(signalFlare);

    signalFlareLight = new THREE.PointLight(0xff6600, 2, 80);
    signalFlareLight.position.set(0, 0, 0);
    signalFlareGroup.add(signalFlareLight);

    var smokeGeometry = new THREE.SphereGeometry(0.5, 4, 4);
    var smokeMaterial = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.3 });
    for (var i = 0; i < 3; i++) {
      var smokeParticle = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
      smokeParticle.position.set(
        (Math.random() - 0.5) * 4,
        -2 - i * 1.5,
        (Math.random() - 0.5) * 4
      );
      signalFlareGroup.add(smokeParticle);
    }

    signalFlareGroup.position.set(-50, 50, 50);
    signalFlareGroup.visible = false;
    scene.add(signalFlareGroup);
  };

  var update = function(delta) {
    if (flareActive) {
      flareTime += delta;
      var flareDuration = 8;

      if (flareTime < flareDuration) {
        var progress = flareTime / flareDuration;
        var riseHeight = progress * 30;
        signalFlareGroup.position.y = 50 + riseHeight;

        var fadeOut = Math.max(0, 1 - (flareTime - flareDuration * 0.6) / (flareDuration * 0.4));
        signalFlareLight.intensity = 2 * fadeOut;
        signalFlare.material.opacity = fadeOut;

        for (var i = 0; i < signalFlareGroup.children.length; i++) {
          var child = signalFlareGroup.children[i];
          if (child !== signalFlare && child !== signalFlareLight) {
            child.material.opacity = 0.3 * fadeOut;
          }
        }
      } else {
        flareActive = false;
        signalFlareGroup.visible = false;
      }
    }

    if (observationBalloon) {
      balloonSwayAngle += delta * 0.3 * balloonSwayDirection;
      if (balloonSwayAngle > 0.3) {
        balloonSwayDirection = -1;
      } else if (balloonSwayAngle < -0.3) {
        balloonSwayDirection = 1;
      }
      observationBalloon.rotation.z = balloonSwayAngle;
    }

    if (artilleryGroup) {
      var smokeEmission = Math.random() < 0.02;
      if (smokeEmission && artillerySmokeParticles.length < 15) {
        var smokeGeometry = new THREE.SphereGeometry(1 + Math.random() * 0.5, 4, 4);
        var smokeMaterial = new THREE.MeshBasicMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0.4
        });
        var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.copy(artilleryGroup.position);
        smoke.position.y += 5;
        smoke.position.x += (Math.random() - 0.5) * 3;
        smoke.position.z += (Math.random() - 0.5) * 3;
        scene.add(smoke);
        artillerySmokeParticles.push({
          mesh: smoke,
          life: 3,
          maxLife: 3
        });
      }

      for (var j = artillerySmokeParticles.length - 1; j >= 0; j--) {
        var particle = artillerySmokeParticles[j];
        particle.life -= delta;
        if (particle.life > 0) {
          particle.mesh.position.y += delta * 2;
          particle.mesh.material.opacity = 0.4 * (particle.life / particle.maxLife);
        } else {
          scene.remove(particle.mesh);
          artillerySmokeParticles.splice(j, 1);
        }
      }
    }
  };

  var reset = function() {
    flareActive = false;
    flareTime = 0;
    balloonSwayAngle = 0;
    balloonSwayDirection = 1;

    for (var i = artillerySmokeParticles.length - 1; i >= 0; i--) {
      scene.remove(artillerySmokeParticles[i].mesh);
    }
    artillerySmokeParticles = [];

    if (signalFlareGroup) {
      signalFlareGroup.visible = false;
      signalFlareGroup.position.set(-50, 50, 50);
    }
  };

  var fireSignalFlare = function() {
    flareActive = true;
    flareTime = 0;
    signalFlareGroup.visible = true;
    signalFlareGroup.position.set(-50, 0, 50);
    for (var i = 0; i < signalFlareGroup.children.length; i++) {
      var child = signalFlareGroup.children[i];
      if (child.material && child.material.opacity !== undefined) {
        child.material.opacity = 1;
      }
    }
  };

  return {
    init: init,
    update: update,
    reset: reset,
    fireSignalFlare: fireSignalFlare
  };
}());
