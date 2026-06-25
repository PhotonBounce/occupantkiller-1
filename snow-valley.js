window.SnowValley = (function() {
  'use strict';

  var scene;
  var camera;
  var snowflakes = [];
  var chairliftChairs = [];
  var riverShimmerMaterial;
  var wind = 0;
  var time = 0;

  var init = function(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;

    // Valley terrain - wide snow-covered ground
    var terrainGeometry = new THREE.BoxGeometry(500, 15, 400);
    var terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      metalness: 0.1,
      roughness: 0.9
    });
    var terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.position.y = -8;
    terrain.castShadow = true;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Mountain walls - left cliff
    var leftCliffGeometry = new THREE.BoxGeometry(40, 200, 400);
    var rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      metalness: 0.2,
      roughness: 0.8
    });
    var leftCliff = new THREE.Mesh(leftCliffGeometry, rockMaterial);
    leftCliff.position.set(-240, 85, 0);
    leftCliff.castShadow = true;
    leftCliff.receiveShadow = true;
    scene.add(leftCliff);

    // Mountain walls - right cliff
    var rightCliff = new THREE.Mesh(leftCliffGeometry, rockMaterial);
    rightCliff.position.set(240, 85, 0);
    rightCliff.castShadow = true;
    rightCliff.receiveShadow = true;
    scene.add(rightCliff);

    // Snow-capped peaks
    var peakLeft = new THREE.Mesh(
      new THREE.ConeGeometry(80, 150, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.15,
        roughness: 0.7
      })
    );
    peakLeft.position.set(-240, 180, 0);
    peakLeft.castShadow = true;
    peakLeft.receiveShadow = true;
    scene.add(peakLeft);

    var peakRight = new THREE.Mesh(
      new THREE.ConeGeometry(80, 150, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.15,
        roughness: 0.7
      })
    );
    peakRight.position.set(240, 180, 0);
    peakRight.castShadow = true;
    peakRight.receiveShadow = true;
    scene.add(peakRight);

    // Frozen river - ice strip down the valley
    riverShimmerMaterial = new THREE.MeshStandardMaterial({
      color: 0x7fc7e8,
      metalness: 0.8,
      roughness: 0.2
    });
    var riverGeometry = new THREE.BoxGeometry(60, 2, 350);
    var river = new THREE.Mesh(riverGeometry, riverShimmerMaterial);
    river.position.set(0, -5, 0);
    river.castShadow = true;
    river.receiveShadow = true;
    scene.add(river);

    // Ice cracks - LineSegments on river
    var crackGeometry = new THREE.BufferGeometry();
    var crackPositions = new Float32Array([
      -20, -4, -150, 20, -4, -150,
      -15, -4, -80, 15, -4, -80,
      -25, -4, 50, 25, -4, 50,
      -10, -4, 120, 10, -4, 120
    ]);
    crackGeometry.setAttribute('position', new THREE.BufferAttribute(crackPositions, 3));
    var crackMaterial = new THREE.LineBasicMaterial({ color: 0x4a8fb9 });
    var cracks = new THREE.LineSegments(crackGeometry, crackMaterial);
    scene.add(cracks);

    // Ski lodge HQ - main chalet building
    var lodgeGeometry = new THREE.BoxGeometry(80, 50, 60);
    var lodgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.1,
      roughness: 0.8
    });
    var lodge = new THREE.Mesh(lodgeGeometry, lodgeMaterial);
    lodge.position.set(0, 25, -120);
    lodge.castShadow = true;
    lodge.receiveShadow = true;
    scene.add(lodge);

    // Lodge roof - steep cone roof
    var roofGeometry = new THREE.ConeGeometry(65, 50, 32);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.6
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 75, -120);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);

    // Lodge balcony
    var balconyGeometry = new THREE.BoxGeometry(85, 4, 20);
    var balconyMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b3410,
      metalness: 0.3,
      roughness: 0.7
    });
    var balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
    balcony.position.set(0, 50, -90);
    balcony.castShadow = true;
    balcony.receiveShadow = true;
    scene.add(balcony);

    // Chairlift cables
    var cableGeometry = new THREE.BufferGeometry();
    var cablePositions = new Float32Array([
      -80, 100, -80, 80, 60, 80,
      80, 100, -80, -80, 60, 80
    ]);
    cableGeometry.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 });
    var cables = new THREE.LineSegments(cableGeometry, cableMaterial);
    scene.add(cables);

    // Chairlift chairs
    for (var i = 0; i < 8; i++) {
      var chairGeometry = new THREE.BoxGeometry(8, 8, 8);
      var chairMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6b35,
        metalness: 0.4,
        roughness: 0.6
      });
      var chair = new THREE.Mesh(chairGeometry, chairMaterial);
      chair.castShadow = true;
      chair.receiveShadow = true;
      chairliftChairs.push({
        mesh: chair,
        position: i / 8,
        offset: Math.random() * Math.PI * 2
      });
      scene.add(chair);
    }

    // Pine trees - scattered throughout valley
    for (var t = 0; t < 15; t++) {
      var treeX = (Math.random() - 0.5) * 400;
      var treeZ = (Math.random() - 0.5) * 300;
      if (Math.abs(treeZ - (-120)) < 100 && Math.abs(treeX) < 100) continue;

      var trunkGeometry = new THREE.CylinderGeometry(5, 8, 40, 16);
      var trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d2817,
        metalness: 0.1,
        roughness: 0.9
      });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(treeX, 20, treeZ);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);

      // Snow-laden conical branches
      for (var b = 0; b < 4; b++) {
        var branchGeometry = new THREE.ConeGeometry(25 - b * 5, 35 - b * 8, 32);
        var branchMaterial = new THREE.MeshStandardMaterial({
          color: 0xe8f4f8,
          metalness: 0.1,
          roughness: 0.8
        });
        var branch = new THREE.Mesh(branchGeometry, branchMaterial);
        branch.position.set(treeX, 35 + b * 15, treeZ);
        branch.castShadow = true;
        branch.receiveShadow = true;
        scene.add(branch);
      }
    }

    // Avalanche debris zone - scattered snow chunks
    for (var a = 0; a < 20; a++) {
      var debrisX = (Math.random() - 0.5) * 300 - 150;
      var debrisZ = (Math.random() - 0.5) * 200 + 150;
      var debrisSize = 8 + Math.random() * 20;

      var debrisGeometry = new THREE.BoxGeometry(debrisSize, debrisSize * 0.7, debrisSize);
      var debrisMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0f8ff,
        metalness: 0.05,
        roughness: 0.85
      });
      var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(debrisX, 5 + Math.random() * 8, debrisZ);
      debris.rotation.set(
        Math.random() * Math.PI * 0.5,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 0.3
      );
      debris.castShadow = true;
      debris.receiveShadow = true;
      scene.add(debris);
    }

    // Snow-buried vehicles
    var vehiclePositions = [
      { x: -100, z: 100 },
      { x: 120, z: 60 },
      { x: -140, z: -40 }
    ];

    for (var v = 0; v < vehiclePositions.length; v++) {
      var vp = vehiclePositions[v];

      // Vehicle body
      var bodyGeometry = new THREE.BoxGeometry(15, 10, 30);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.6,
        roughness: 0.4
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(vp.x, 8, vp.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);

      // Partially buried roof
      var roofPartGeometry = new THREE.BoxGeometry(16, 5, 28);
      var roofPartMaterial = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        metalness: 0.5,
        roughness: 0.6
      });
      var roofPart = new THREE.Mesh(roofPartGeometry, roofPartMaterial);
      roofPart.position.set(vp.x, 15, vp.z);
      roofPart.castShadow = true;
      roofPart.receiveShadow = true;
      scene.add(roofPart);
    }

    // Ski jump ramp
    var rampGeometry = new THREE.BoxGeometry(60, 4, 100);
    var rampMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      metalness: 0.2,
      roughness: 0.7
    });
    var ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.set(-150, 40, 50);
    ramp.rotation.z = Math.PI * 0.15;
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    scene.add(ramp);

    // Ice cave entrance
    var caveGeometry = new THREE.BoxGeometry(50, 60, 20);
    var caveMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7c8c,
      metalness: 0.3,
      roughness: 0.6
    });
    var cave = new THREE.Mesh(caveGeometry, caveMaterial);
    cave.position.set(-220, 30, 150);
    cave.castShadow = true;
    cave.receiveShadow = true;
    scene.add(cave);

    // Cave interior back wall
    var caveBackGeometry = new THREE.BoxGeometry(45, 55, 15);
    var caveBackMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a4a5c,
      metalness: 0.25,
      roughness: 0.7
    });
    var caveBack = new THREE.Mesh(caveBackGeometry, caveBackMaterial);
    caveBack.position.set(-220, 30, 135);
    caveBack.castShadow = true;
    caveBack.receiveShadow = true;
    scene.add(caveBack);

    // Snowfall
    createSnowfall();
  };

  var createSnowfall = function() {
    var snowGeometry = new THREE.BufferGeometry();
    var snowPositions = new Float32Array(3000);

    for (var s = 0; s < 1000; s++) {
      snowPositions[s * 3] = (Math.random() - 0.5) * 600;
      snowPositions[s * 3 + 1] = 200 + Math.random() * 200;
      snowPositions[s * 3 + 2] = (Math.random() - 0.5) * 500;
    }

    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

    var snowMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: true,
      opacity: 0.8,
      transparent: true
    });

    var snowParticles = new THREE.Points(snowGeometry, snowMaterial);
    scene.add(snowParticles);

    for (var sp = 0; sp < 1000; sp++) {
      snowflakes.push({
        x: snowPositions[sp * 3],
        y: snowPositions[sp * 3 + 1],
        z: snowPositions[sp * 3 + 2],
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.3 - Math.random() * 0.2,
        vz: (Math.random() - 0.5) * 0.3
      });
    }

    snowflakes.particleSystem = snowParticles;
  };

  var update = function(delta) {
    time += delta;

    // Wind gusts
    wind = Math.sin(time * 0.3) * 0.5 + Math.cos(time * 0.7) * 0.3;

    // Update snowfall
    if (snowflakes.particleSystem) {
      var positions = snowflakes.particleSystem.geometry.attributes.position.array;

      for (var sf = 0; sf < snowflakes.length; sf++) {
        var flake = snowflakes[sf];

        flake.x += (flake.vx + wind * 0.3) * delta;
        flake.y += flake.vy * delta;
        flake.z += flake.vz * delta;

        // Wrap snowflakes
        if (flake.y < -20) {
          flake.y = 400;
        }
        if (flake.x > 300) flake.x = -300;
        if (flake.x < -300) flake.x = 300;
        if (flake.z > 250) flake.z = -250;
        if (flake.z < -250) flake.z = 250;

        positions[sf * 3] = flake.x;
        positions[sf * 3 + 1] = flake.y;
        positions[sf * 3 + 2] = flake.z;
      }

      snowflakes.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Animate chairlift
    for (var c = 0; c < chairliftChairs.length; c++) {
      var chair = chairliftChairs[c];
      var progress = (chair.position + time * 0.15) % 1;

      // Interpolate between cable positions
      var startX = -80 + progress * 160;
      var startY = 100 + progress * -40;
      var startZ = -80 + progress * 160;

      chair.mesh.position.set(startX, startY, startZ);
    }

    // River shimmer effect
    if (riverShimmerMaterial) {
      var shimmer = 0.2 + Math.sin(time * 2) * 0.1;
      riverShimmerMaterial.metalness = 0.7 + shimmer;
      riverShimmerMaterial.emissive.setHSL(0.55, 0.3, 0.15 + shimmer * 0.1);
    }
  };

  var reset = function() {
    time = 0;
    wind = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
