window.ForestAmbush = (function() {
  'use strict';

  var meshes = [];
  var lights = [];
  var animationState = {
    time: 0,
    birdFlying: false,
    birdTime: 0,
    fireGlow: 0.5,
    leafFalling: [],
    spiderHoleDepth: 0
  };

  var spawnPoints = [];

  function init(scene, camera) {
    meshes = [];
    lights = [];
    animationState = {
      time: 0,
      birdFlying: false,
      birdTime: 0,
      fireGlow: 0.5,
      leafFalling: [],
      spiderHoleDepth: 0
    };

    // Lighting setup
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(50, 60, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    lights.push(directionalLight);

    // Forest floor base
    var groundGeo = new THREE.BoxGeometry(200, 0.5, 200);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x2A1F15 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    ground.position.y = -0.25;
    scene.add(ground);
    meshes.push(ground);

    // Massive tree trunks - 8 large trees
    var treePositions = [
      { x: -40, z: -30 },
      { x: 40, z: -30 },
      { x: -40, z: 30 },
      { x: 40, z: 30 },
      { x: -60, z: 0 },
      { x: 60, z: 0 },
      { x: 0, z: -60 },
      { x: 0, z: 60 }
    ];

    treePositions.forEach(function(pos) {
      createTreeWithCanopy(scene, pos.x, pos.z);
    });

    // Forest floor - exposed roots
    createForestFloorRoots(scene);

    // Fallen log command post
    createFallenLogCommandPost(scene, 0, 0);

    // Tree stand sniper platform
    createTreeStandSniper(scene, -45, -45);
    createTreeStandSniper(scene, 50, 40);

    // Trip-wire lines between trees
    createTripWires(scene);

    // Spider hole entrances
    createSpiderHoles(scene);

    // Dead leaves ground cover
    createDeadLeavesCover(scene);

    // Creek crossing
    createCreekCrossing(scene);

    // Mossy boulders
    createMossyBoulders(scene);

    // Supply cache hidden
    createSupplyCache(scene);

    // Tangled vine clusters
    createVineClusters(scene);

    // Fog mist between trees
    createFogMist(scene);

    // Abandoned campfire
    createCampfire(scene);

    // Startle bird for flight animation
    createStartleBird(scene);

    // Define spawn points
    spawnPoints = [
      new THREE.Vector3(-50, 1, -50),
      new THREE.Vector3(50, 1, -50),
      new THREE.Vector3(-50, 1, 50),
      new THREE.Vector3(50, 1, 50),
      new THREE.Vector3(0, 1, 0)
    ];
  }

  function createTreeWithCanopy(scene, x, z) {
    // Trunk
    var trunkGeo = new THREE.CylinderGeometry(4, 5, 25, 16);
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x4A2F1A });
    var trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 12.5, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    meshes.push(trunk);

    // Canopy lower layer - sphere
    var canopyLowerGeo = new THREE.SphereGeometry(12, 16, 16);
    var canopyMat = new THREE.MeshLambertMaterial({ color: 0x1A3A1A });
    var canopyLower = new THREE.Mesh(canopyLowerGeo, canopyMat);
    canopyLower.position.set(x, 28, z);
    canopyLower.castShadow = true;
    canopyLower.receiveShadow = true;
    scene.add(canopyLower);
    meshes.push(canopyLower);

    // Canopy upper layer - cone
    var canopyUpperGeo = new THREE.ConeGeometry(10, 15, 16);
    var canopyUpper = new THREE.Mesh(canopyUpperGeo, canopyMat);
    canopyUpper.position.set(x, 40, z);
    canopyUpper.castShadow = true;
    canopyUpper.receiveShadow = true;
    scene.add(canopyUpper);
    meshes.push(canopyUpper);

    // Top decorative sphere
    var topCanopyGeo = new THREE.SphereGeometry(8, 12, 12);
    var topCanopy = new THREE.Mesh(topCanopyGeo, canopyMat);
    topCanopy.position.set(x, 50, z);
    topCanopy.castShadow = true;
    topCanopy.receiveShadow = true;
    scene.add(topCanopy);
    meshes.push(topCanopy);
  }

  function createForestFloorRoots(scene) {
    // Exposed root system
    var positions = [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: -20, z: 20 },
      { x: 20, z: 20 },
      { x: 0, z: 0 }
    ];

    positions.forEach(function(pos) {
      var rootGeo = new THREE.BoxGeometry(3, 0.8, 8);
      var rootMat = new THREE.MeshLambertMaterial({ color: 0x3A2515 });
      var root = new THREE.Mesh(rootGeo, rootMat);
      root.position.set(pos.x, 0.4, pos.z);
      root.rotation.z = Math.random() * Math.PI;
      root.castShadow = true;
      root.receiveShadow = true;
      scene.add(root);
      meshes.push(root);
    });
  }

  function createFallenLogCommandPost(scene, x, z) {
    // Giant horizontal log
    var logGeo = new THREE.CylinderGeometry(3, 3.5, 30, 16);
    var logMat = new THREE.MeshLambertMaterial({ color: 0x4A2F1A });
    var log = new THREE.Mesh(logGeo, logMat);
    log.rotation.z = Math.PI / 2.5;
    log.position.set(x + 2, 2, z - 5);
    log.castShadow = true;
    log.receiveShadow = true;
    scene.add(log);
    meshes.push(log);

    // Interior command post box
    var interiorGeo = new THREE.BoxGeometry(8, 3, 6);
    var interiorMat = new THREE.MeshLambertMaterial({ color: 0x0A1A0A });
    var interior = new THREE.Mesh(interiorGeo, interiorMat);
    interior.position.set(x, 3, z);
    interior.castShadow = true;
    interior.receiveShadow = true;
    scene.add(interior);
    meshes.push(interior);

    // Support structure
    var supportGeo = new THREE.BoxGeometry(10, 1.5, 8);
    var supportMat = new THREE.MeshLambertMaterial({ color: 0x3A2515 });
    var support = new THREE.Mesh(supportGeo, supportMat);
    support.position.set(x, 0.75, z);
    support.castShadow = true;
    support.receiveShadow = true;
    scene.add(support);
    meshes.push(support);
  }

  function createTreeStandSniper(scene, x, z) {
    // Platform
    var platformGeo = new THREE.BoxGeometry(6, 0.5, 6);
    var platformMat = new THREE.MeshLambertMaterial({ color: 0x3A2515 });
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(x, 18, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    meshes.push(platform);

    // Vertical support logs
    var supportGeo = new THREE.CylinderGeometry(0.8, 0.8, 16, 12);
    var supportMat = new THREE.MeshLambertMaterial({ color: 0x4A2F1A });

    var support1 = new THREE.Mesh(supportGeo, supportMat);
    support1.position.set(x - 2, 8, z - 2);
    support1.castShadow = true;
    support1.receiveShadow = true;
    scene.add(support1);
    meshes.push(support1);

    var support2 = new THREE.Mesh(supportGeo, supportMat);
    support2.position.set(x + 2, 8, z - 2);
    support2.castShadow = true;
    support2.receiveShadow = true;
    scene.add(support2);
    meshes.push(support2);

    var support3 = new THREE.Mesh(supportGeo, supportMat);
    support3.position.set(x - 2, 8, z + 2);
    support3.castShadow = true;
    support3.receiveShadow = true;
    scene.add(support3);
    meshes.push(support3);

    var support4 = new THREE.Mesh(supportGeo, supportMat);
    support4.position.set(x + 2, 8, z + 2);
    support4.castShadow = true;
    support4.receiveShadow = true;
    scene.add(support4);
    meshes.push(support4);

    // Railing
    var railGeo = new THREE.BoxGeometry(6, 1.2, 0.4);
    var railMat = new THREE.MeshLambertMaterial({ color: 0x2A1F15 });
    var rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(x, 18.8, z + 2.8);
    rail.castShadow = true;
    rail.receiveShadow = true;
    scene.add(rail);
    meshes.push(rail);
  }

  function createTripWires(scene) {
    var wirePositions = [
      { start: [-35, 0.3, -35], end: [-35, 0.3, -25] },
      { start: [35, 0.3, -35], end: [35, 0.3, -25] },
      { start: [-35, 0.3, 35], end: [-35, 0.3, 25] },
      { start: [35, 0.3, 35], end: [35, 0.3, 25] },
      { start: [-25, 0.3, 0], end: [25, 0.3, 0] }
    ];

    wirePositions.forEach(function(wire) {
      var points = [
        new THREE.Vector3(wire.start[0], wire.start[1], wire.start[2]),
        new THREE.Vector3(wire.end[0], wire.end[1], wire.end[2])
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({ color: 0x8B7355, linewidth: 2 });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      meshes.push(line);
    });
  }

  function createSpiderHoles(scene) {
    var holePositions = [
      { x: -55, z: -55 },
      { x: 55, z: -55 },
      { x: -55, z: 55 },
      { x: 55, z: 55 }
    ];

    holePositions.forEach(function(pos) {
      // Hole entrance
      var holeGeo = new THREE.BoxGeometry(2.5, 2, 2.5);
      var holeMat = new THREE.MeshLambertMaterial({ color: 0x0A0A0A });
      var hole = new THREE.Mesh(holeGeo, holeMat);
      hole.position.set(pos.x, 1, pos.z);
      hole.castShadow = true;
      hole.receiveShadow = true;
      scene.add(hole);
      meshes.push(hole);

      // Dirt mound
      var moundGeo = new THREE.SphereGeometry(3, 12, 8);
      var moundMat = new THREE.MeshLambertMaterial({ color: 0x3A2515 });
      var mound = new THREE.Mesh(moundGeo, moundMat);
      mound.scale.set(1, 0.4, 1);
      mound.position.set(pos.x, 0.5, pos.z);
      mound.castShadow = true;
      mound.receiveShadow = true;
      scene.add(mound);
      meshes.push(mound);
    });
  }

  function createDeadLeavesCover(scene) {
    var leafPositions = [
      { x: -30, z: -30 },
      { x: 30, z: -30 },
      { x: -30, z: 30 },
      { x: 30, z: 30 },
      { x: 0, z: -40 },
      { x: 0, z: 40 }
    ];

    leafPositions.forEach(function(pos) {
      var leafGeo = new THREE.BoxGeometry(15, 0.15, 12);
      var leafMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
      var leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(pos.x, 0.08, pos.z);
      leaf.rotation.x = Math.random() * 0.2;
      leaf.rotation.z = Math.random() * 0.2;
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      scene.add(leaf);
      meshes.push(leaf);
    });
  }

  function createCreekCrossing(scene) {
    // Water surface
    var waterGeo = new THREE.BoxGeometry(8, 0.3, 25);
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x1A4A5A, transparent: true, opacity: 0.6 });
    var water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(0, 0.15, 0);
    water.receiveShadow = true;
    scene.add(water);
    meshes.push(water);

    // Rocks in creek
    var rockPositions = [-6, -3, 0, 3, 6];
    rockPositions.forEach(function(x) {
      var rockGeo = new THREE.SphereGeometry(1.2, 12, 8);
      var rockMat = new THREE.MeshLambertMaterial({ color: 0x5A6A7A });
      var rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(x, 0.5, -10 + Math.random() * 4);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      meshes.push(rock);
    });
  }

  function createMossyBoulders(scene) {
    var boulderPositions = [
      { x: -70, z: -40 },
      { x: 70, z: -40 },
      { x: -70, z: 40 },
      { x: 70, z: 40 },
      { x: -40, z: -70 },
      { x: 40, z: -70 }
    ];

    boulderPositions.forEach(function(pos) {
      var boulderGeo = new THREE.SphereGeometry(4, 14, 10);
      var boulderMat = new THREE.MeshLambertMaterial({ color: 0x6A7A6A });
      var boulder = new THREE.Mesh(boulderGeo, boulderMat);
      boulder.position.set(pos.x, 2.5, pos.z);
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      scene.add(boulder);
      meshes.push(boulder);
    });
  }

  function createSupplyCache(scene) {
    // Crate 1
    var crateGeo = new THREE.BoxGeometry(2.5, 2, 2.5);
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
    var crate1 = new THREE.Mesh(crateGeo, crateMat);
    crate1.position.set(-50, 1, 0);
    crate1.castShadow = true;
    crate1.receiveShadow = true;
    scene.add(crate1);
    meshes.push(crate1);

    // Crate 2
    var crate2 = new THREE.Mesh(crateGeo, crateMat);
    crate2.position.set(-48, 1, 0);
    crate2.castShadow = true;
    crate2.receiveShadow = true;
    scene.add(crate2);
    meshes.push(crate2);

    // Hollow shelter
    var shelterGeo = new THREE.BoxGeometry(6, 3, 4);
    var shelterMat = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
    var shelter = new THREE.Mesh(shelterGeo, shelterMat);
    shelter.position.set(-49, 2, 0);
    shelter.castShadow = true;
    shelter.receiveShadow = true;
    scene.add(shelter);
    meshes.push(shelter);
  }

  function createVineClusters(scene) {
    var vinePositions = [
      { x: -45, z: -45 },
      { x: 45, z: -45 },
      { x: -45, z: 45 },
      { x: 45, z: 45 }
    ];

    vinePositions.forEach(function(pos) {
      for (var i = 0; i < 3; i++) {
        var startPoint = new THREE.Vector3(pos.x + (i - 1) * 2, 30, pos.z);
        var endPoint = new THREE.Vector3(pos.x + (i - 1) * 2, 5, pos.z + 3);
        var points = [startPoint, endPoint];
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var material = new THREE.LineBasicMaterial({ color: 0x2A4A1A, linewidth: 1 });
        var vine = new THREE.LineSegments(geometry, material);
        scene.add(vine);
        meshes.push(vine);
      }
    });
  }

  function createFogMist(scene) {
    var mistPositions = [
      { x: -30, z: 0 },
      { x: 30, z: 0 },
      { x: 0, z: -30 },
      { x: 0, z: 30 }
    ];

    mistPositions.forEach(function(pos) {
      var mistGeo = new THREE.SphereGeometry(8, 12, 12);
      var mistMat = new THREE.MeshLambertMaterial({
        color: 0xCCCCCC,
        transparent: true,
        opacity: 0.15
      });
      var mist = new THREE.Mesh(mistGeo, mistMat);
      mist.position.set(pos.x, 3, pos.z);
      mist.castShadow = false;
      mist.receiveShadow = false;
      scene.add(mist);
      meshes.push(mist);
    });
  }

  function createCampfire(scene) {
    // Fire ring
    var ringGeo = new THREE.CylinderGeometry(3, 3, 0.5, 16);
    var ringMat = new THREE.MeshLambertMaterial({ color: 0x3A2515 });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(50, 0.25, -50);
    ring.castShadow = true;
    ring.receiveShadow = true;
    scene.add(ring);
    meshes.push(ring);

    // Embers
    for (var i = 0; i < 5; i++) {
      var emberGeo = new THREE.SphereGeometry(0.5, 8, 8);
      var emberMat = new THREE.MeshBasicMaterial({ color: 0xFF6B1A });
      var ember = new THREE.Mesh(emberGeo, emberMat);
      ember.position.set(
        50 + (Math.random() - 0.5) * 4,
        1 + Math.random() * 2,
        -50 + (Math.random() - 0.5) * 4
      );
      scene.add(ember);
      meshes.push(ember);
    }
  }

  function createStartleBird(scene) {
    // Bird body
    var birdGeo = new THREE.SphereGeometry(0.3, 8, 8);
    var birdMat = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
    var bird = new THREE.Mesh(birdGeo, birdMat);
    bird.position.set(-60, 25, -60);
    bird.userData.isStartleBird = true;
    bird.userData.velocity = new THREE.Vector3(0, 0, 0);
    scene.add(bird);
    meshes.push(bird);
  }

  function update(delta) {
    animationState.time += delta;

    // Fog mist drifting
    meshes.forEach(function(mesh) {
      if (mesh.material && mesh.material.opacity !== undefined && mesh.material.opacity < 0.25) {
        mesh.position.x += Math.sin(animationState.time * 0.5) * delta * 0.1;
        mesh.position.z += Math.cos(animationState.time * 0.4) * delta * 0.1;
      }
    });

    // Canopy swaying in wind
    meshes.forEach(function(mesh) {
      if (mesh.geometry && mesh.geometry.type === 'SphereGeometry' && mesh.position.y > 20) {
        var originalY = mesh.position.y;
        mesh.rotation.x = Math.sin(animationState.time * 0.6) * 0.03;
        mesh.rotation.z = Math.cos(animationState.time * 0.5) * 0.03;
      }
    });

    // Fire ember glow flickering
    meshes.forEach(function(mesh) {
      if (mesh.material && mesh.material.color && mesh.material.emissive) {
        if (mesh.userData.isEmber || (mesh.position.x > 45 && mesh.position.x < 55 && mesh.position.z < -45)) {
          animationState.fireGlow = 0.3 + Math.sin(animationState.time * 3) * 0.2;
          mesh.material.emissive.setHex(0xFF6B1A);
          mesh.material.emissiveIntensity = animationState.fireGlow * 0.5;
        }
      }
    });

    // Trip-wire glinting
    meshes.forEach(function(mesh) {
      if (mesh instanceof THREE.LineSegments && mesh.material.color.getHex() === 0x8B7355) {
        mesh.material.linewidth = 1 + Math.sin(animationState.time * 2) * 0.5;
      }
    });

    // Spider hole figure emerging/retreating
    animationState.spiderHoleDepth = Math.sin(animationState.time * 0.4) * 0.5 + 0.5;

    // Bird startled flight
    meshes.forEach(function(mesh) {
      if (mesh.userData.isStartleBird) {
        var flightCycle = (animationState.time * 2) % 8;
        if (flightCycle < 6) {
          mesh.userData.velocity.x = Math.cos(animationState.time * 1.5) * 15;
          mesh.userData.velocity.y = 8 + Math.sin(animationState.time * 4) * 3;
          mesh.userData.velocity.z = Math.sin(animationState.time * 1.2) * 15;

          mesh.position.x += mesh.userData.velocity.x * delta;
          mesh.position.y += mesh.userData.velocity.y * delta;
          mesh.position.z += mesh.userData.velocity.z * delta;
        } else {
          mesh.position.set(-60, 25, -60);
        }
      }
    });

    // Leaf falling animation
    if (animationState.time % 2 < delta) {
      var newLeaf = {
        x: (Math.random() - 0.5) * 120,
        z: (Math.random() - 0.5) * 120,
        y: 50 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -3 - Math.random() * 2,
        vz: (Math.random() - 0.5) * 1
      };
      animationState.leafFalling.push(newLeaf);
    }

    // Update falling leaves
    for (var i = animationState.leafFalling.length - 1; i >= 0; i--) {
      var leaf = animationState.leafFalling[i];
      leaf.y += leaf.vy * delta;
      leaf.x += leaf.vx * delta;
      leaf.z += leaf.vz * delta;

      if (leaf.y < 0) {
        animationState.leafFalling.splice(i, 1);
      }
    }

    // Sniper glint flash
    if (Math.random() < 0.02 && animationState.time > 3) {
      meshes.forEach(function(mesh) {
        if (mesh.position.y > 15 && mesh.position.y < 20) {
          if (Math.random() < 0.1 && mesh.material && mesh.material.emissive) {
            mesh.material.emissive.setHex(0xFFFFFF);
            mesh.material.emissiveIntensity = 0.8;
            setTimeout(function() {
              mesh.material.emissiveIntensity = 0;
            }, 100);
          }
        }
      });
    }
  }

  function reset() {
    meshes.forEach(function(mesh) {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(function(mat) {
            mat.dispose();
          });
        } else {
          mesh.material.dispose();
        }
      }
    });

    lights.forEach(function(light) {
      if (light.parent) {
        light.parent.remove(light);
      }
    });

    meshes = [];
    lights = [];
    animationState = {
      time: 0,
      birdFlying: false,
      birdTime: 0,
      fireGlow: 0.5,
      leafFalling: [],
      spiderHoleDepth: 0
    };
  }

  function getSpawnPoints() {
    return spawnPoints;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: getSpawnPoints
  };
}());
