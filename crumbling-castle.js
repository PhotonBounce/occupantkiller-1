window.CrumblingCastle = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var cracks = [];
  var fallingChunks = [];
  var dustClouds = [];
  var towerLean = 0;
  var maxTowerLean = 0.35;
  var elapsedTime = 0;

  var init = function(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    meshes = [];
    cracks = [];
    fallingChunks = [];
    dustClouds = [];
    towerLean = 0;
    elapsedTime = 0;

    // Create ground
    var groundGeo = new THREE.BoxGeometry(150, 2, 150);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x4a4a3a });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);
    meshes.push(ground);

    // Main keep - tall leaning tower
    var keepGeo = new THREE.BoxGeometry(20, 50, 20);
    var keepMat = new THREE.MeshStandardMaterial({ color: 0x6b5d52, roughness: 0.8 });
    var keep = new THREE.Mesh(keepGeo, keepMat);
    keep.position.set(0, 25, 0);
    keep.castShadow = true;
    keep.receiveShadow = true;
    scene.add(keep);
    meshes.push(keep);

    // Add cracks to keep facade
    addCracksToWall(keep.position, 20, 50);

    // Curtain walls
    var wallGeo = new THREE.BoxGeometry(80, 25, 5);
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x7a6d60, roughness: 0.9 });

    var northWall = new THREE.Mesh(wallGeo, wallMat);
    northWall.position.set(0, 12.5, 40);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);
    meshes.push(northWall);
    addCracksToWall(northWall.position, 80, 25);

    var eastWall = new THREE.Mesh(wallGeo, wallMat);
    eastWall.rotation.y = Math.PI / 2;
    eastWall.position.set(40, 12.5, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);
    meshes.push(eastWall);
    addCracksToWall(eastWall.position, 80, 25);

    var southWall = new THREE.Mesh(wallGeo, wallMat);
    southWall.position.set(0, 12.5, -40);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);
    meshes.push(southWall);
    addCracksToWall(southWall.position, 80, 25);

    var westWall = new THREE.Mesh(wallGeo, wallMat);
    westWall.rotation.y = Math.PI / 2;
    westWall.position.set(-40, 12.5, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);
    meshes.push(westWall);
    addCracksToWall(westWall.position, 80, 25);

    // Leaning tower
    var towerGeo = new THREE.CylinderGeometry(8, 9, 45, 16);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0x6b5d52, roughness: 0.85 });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(35, 22.5, 35);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    meshes.push(tower);

    // Collapsed east wing debris pile
    for (var i = 0; i < 15; i++) {
      var debrisGeo = new THREE.BoxGeometry(
        Math.random() * 6 + 3,
        Math.random() * 4 + 2,
        Math.random() * 6 + 3
      );
      var debrisMat = new THREE.MeshStandardMaterial({
        color: 0x8b7d6b,
        roughness: 0.9
      });
      var debris = new THREE.Mesh(debrisGeo, debrisMat);
      debris.position.set(
        55 + Math.random() * 20,
        2 + i * 2 + Math.random() * 3,
        25 + Math.random() * 15
      );
      debris.rotation.set(
        Math.random() * 0.5,
        Math.random() * Math.PI,
        Math.random() * 0.5
      );
      debris.castShadow = true;
      debris.receiveShadow = true;
      scene.add(debris);
      meshes.push(debris);
    }

    // Inner bailey courtyard floor
    var baileyGeo = new THREE.BoxGeometry(60, 3, 60);
    var baileyMat = new THREE.MeshStandardMaterial({ color: 0x5a5a4a, roughness: 0.95 });
    var bailey = new THREE.Mesh(baileyGeo, baileyMat);
    bailey.position.set(0, -1.5, 0);
    bailey.receiveShadow = true;
    scene.add(bailey);
    meshes.push(bailey);

    // Great hall ruins - open vaulted structure
    var hallGeo = new THREE.BoxGeometry(30, 35, 25);
    var hallMat = new THREE.MeshStandardMaterial({ color: 0x6d6050, wireframe: false });
    var hall = new THREE.Mesh(hallGeo, hallMat);
    hall.position.set(-25, 17.5, -20);
    hall.castShadow = true;
    hall.receiveShadow = true;
    scene.add(hall);
    meshes.push(hall);

    // Dungeon entrance hole in floor
    var holeGeo = new THREE.CylinderGeometry(6, 6, 10, 12);
    var holeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a0a });
    var dungeon = new THREE.Mesh(holeGeo, holeMat);
    dungeon.position.set(-35, -5, 10);
    dungeon.receiveShadow = true;
    scene.add(dungeon);
    meshes.push(dungeon);

    // Flying buttresses
    for (var i = 0; i < 6; i++) {
      var buttressGeo = new THREE.BoxGeometry(3, 20, 4);
      var buttressMat = new THREE.MeshStandardMaterial({ color: 0x7a6d60 });
      var buttress = new THREE.Mesh(buttressGeo, buttressMat);
      buttress.position.set(20 * Math.cos(i * Math.PI / 3), 10, 20 * Math.sin(i * Math.PI / 3));
      buttress.rotation.z = 0.3;
      if (Math.random() > 0.6) {
        buttress.scale.y = 0.4;
        buttress.position.y = 2;
      }
      buttress.castShadow = true;
      buttress.receiveShadow = true;
      scene.add(buttress);
      meshes.push(buttress);
    }

    // Drawbridge in half-raised position
    var bridgeGeo = new THREE.BoxGeometry(18, 2, 12);
    var bridgeMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a });
    var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(-40, 8, 0);
    bridge.rotation.z = 0.6;
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    scene.add(bridge);
    meshes.push(bridge);

    // Create initial falling chunks
    for (var i = 0; i < 8; i++) {
      createFallingChunk();
    }

    // Create initial dust clouds
    for (var i = 0; i < 5; i++) {
      createDustCloud();
    }

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    return {
      meshes: meshes,
      cracks: cracks,
      fallingChunks: fallingChunks,
      dustClouds: dustClouds
    };
  };

  var addCracksToWall = function(position, width, height) {
    var crackStartX = position.x - width / 2 + 5;
    var crackStartY = position.y - height / 2 + 5;

    for (var i = 0; i < 3; i++) {
      var crackObj = {
        startX: crackStartX + Math.random() * 10,
        startY: crackStartY + Math.random() * 10,
        length: Math.random() * 8 + 5,
        angle: Math.random() * Math.PI / 2,
        expansion: 0,
        maxExpansion: Math.random() * 15 + 10,
        lineSegments: null,
        position: new THREE.Vector3(position.x, position.y, position.z)
      };
      cracks.push(crackObj);
      drawCrack(crackObj);
    }
  };

  var drawCrack = function(crackObj) {
    if (crackObj.lineSegments) {
      scene.remove(crackObj.lineSegments);
    }

    var points = [];
    var segments = 8;

    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var x = crackObj.startX + Math.cos(crackObj.angle) * (crackObj.length + crackObj.expansion) * t;
      var y = crackObj.startY + Math.sin(crackObj.angle) * (crackObj.length + crackObj.expansion) * t;
      var randomJitter = Math.sin(i * 0.5) * 0.5;
      points.push(new THREE.Vector3(x + randomJitter, y, 0.1));
    }

    var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0x444433, linewidth: 2 });
    var lineSegments = new THREE.LineSegments(lineGeo, lineMat);
    lineSegments.position.copy(crackObj.position);
    scene.add(lineSegments);
    crackObj.lineSegments = lineSegments;
  };

  var createFallingChunk = function() {
    var chunkGeo = new THREE.BoxGeometry(
      Math.random() * 4 + 2,
      Math.random() * 3 + 1,
      Math.random() * 4 + 2
    );
    var chunkMat = new THREE.MeshStandardMaterial({
      color: 0x8b7d6b,
      roughness: 0.85
    });
    var chunk = new THREE.Mesh(chunkGeo, chunkMat);

    var spawnX = Math.random() * 60 - 30;
    var spawnZ = Math.random() * 60 - 30;
    var spawnY = Math.random() * 30 + 30;

    chunk.position.set(spawnX, spawnY, spawnZ);
    chunk.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    chunk.castShadow = true;
    chunk.receiveShadow = true;
    scene.add(chunk);

    var chunkObj = {
      mesh: chunk,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        -10 - Math.random() * 5,
        (Math.random() - 0.5) * 3
      ),
      angularVelocity: new THREE.Vector3(
        Math.random() * 3 - 1.5,
        Math.random() * 3 - 1.5,
        Math.random() * 3 - 1.5
      ),
      lifetime: Math.random() * 5 + 8,
      age: 0
    };

    fallingChunks.push(chunkObj);
  };

  var createDustCloud = function() {
    var dustGeo = new THREE.SphereGeometry(1, 8, 8);
    var dustMat = new THREE.MeshStandardMaterial({
      color: 0xb5a89a,
      transparent: true,
      opacity: 0.3,
      roughness: 1.0
    });

    var dustParticles = [];
    for (var i = 0; i < 5; i++) {
      var sphere = new THREE.Mesh(dustGeo, dustMat);
      var offsetRadius = Math.random() * 3;
      var angle = Math.random() * Math.PI * 2;
      sphere.position.set(
        Math.cos(angle) * offsetRadius,
        Math.random() * 2,
        Math.sin(angle) * offsetRadius
      );
      sphere.scale.set(
        Math.random() * 1.5 + 0.5,
        Math.random() * 1.5 + 0.5,
        Math.random() * 1.5 + 0.5
      );
      dustParticles.push(sphere);
    }

    var dustObj = {
      particles: dustParticles,
      basePosition: new THREE.Vector3(
        Math.random() * 60 - 30,
        5,
        Math.random() * 60 - 30
      ),
      expansion: 0,
      maxExpansion: Math.random() * 20 + 15,
      rise: 0,
      maxRise: Math.random() * 30 + 20,
      lifetime: Math.random() * 8 + 12,
      age: 0
    };

    dustClouds.push(dustObj);
  };

  var update = function(delta) {
    elapsedTime += delta;

    // Update leaning tower
    if (towerLean < maxTowerLean) {
      towerLean += delta * 0.08;
      var tower = meshes[6];
      if (tower) {
        tower.rotation.z = Math.min(towerLean, maxTowerLean);
      }
    }

    // Update cracks spreading
    for (var i = 0; i < cracks.length; i++) {
      var crack = cracks[i];
      if (crack.expansion < crack.maxExpansion) {
        crack.expansion += delta * (Math.random() * 8 + 4);
        drawCrack(crack);
      }
    }

    // Update falling chunks
    var chunksToRemove = [];
    for (var i = 0; i < fallingChunks.length; i++) {
      var chunkObj = fallingChunks[i];
      chunkObj.age += delta;

      if (chunkObj.age > chunkObj.lifetime || chunkObj.mesh.position.y < -50) {
        scene.remove(chunkObj.mesh);
        chunksToRemove.push(i);
      } else {
        chunkObj.velocity.y -= 9.8 * delta;
        chunkObj.mesh.position.add(
          chunkObj.velocity.clone().multiplyScalar(delta)
        );

        chunkObj.mesh.rotation.x += chunkObj.angularVelocity.x * delta;
        chunkObj.mesh.rotation.y += chunkObj.angularVelocity.y * delta;
        chunkObj.mesh.rotation.z += chunkObj.angularVelocity.z * delta;

        var fadeStart = chunkObj.lifetime * 0.7;
        if (chunkObj.age > fadeStart) {
          var fadeProgress = (chunkObj.age - fadeStart) / (chunkObj.lifetime - fadeStart);
          chunkObj.mesh.material.opacity = 1 - fadeProgress;
        }
      }
    }

    for (var i = chunksToRemove.length - 1; i >= 0; i--) {
      fallingChunks.splice(chunksToRemove[i], 1);
    }

    // Spawn new chunks periodically
    if (elapsedTime % 0.5 < delta) {
      if (fallingChunks.length < 12) {
        createFallingChunk();
      }
    }

    // Update dust clouds
    var dustToRemove = [];
    for (var i = 0; i < dustClouds.length; i++) {
      var dustObj = dustClouds[i];
      dustObj.age += delta;

      if (dustObj.age > dustObj.lifetime) {
        dustObj.particles.forEach(function(sphere) {
          scene.remove(sphere);
        });
        dustToRemove.push(i);
      } else {
        dustObj.expansion = Math.min(
          dustObj.expansion + delta * 5,
          dustObj.maxExpansion
        );
        dustObj.rise = Math.min(
          dustObj.rise + delta * 8,
          dustObj.maxRise
        );

        var fadeStart = dustObj.lifetime * 0.5;
        var opacity = dustObj.age > fadeStart ?
          0.3 * (1 - (dustObj.age - fadeStart) / (dustObj.lifetime - fadeStart)) :
          0.3;

        dustObj.particles.forEach(function(sphere, idx) {
          var angle = (idx / dustObj.particles.length) * Math.PI * 2;
          var distance = dustObj.expansion;
          sphere.position.x = dustObj.basePosition.x + Math.cos(angle) * distance;
          sphere.position.y = dustObj.basePosition.y + dustObj.rise;
          sphere.position.z = dustObj.basePosition.z + Math.sin(angle) * distance;
          sphere.material.opacity = opacity;
        });
      }
    }

    for (var i = dustToRemove.length - 1; i >= 0; i--) {
      dustClouds.splice(dustToRemove[i], 1);
    }

    // Spawn new dust clouds periodically
    if (elapsedTime % 1.2 < delta) {
      if (dustClouds.length < 8) {
        createDustCloud();
      }
    }
  };

  var reset = function() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    for (var i = cracks.length - 1; i >= 0; i--) {
      if (cracks[i].lineSegments) {
        scene.remove(cracks[i].lineSegments);
      }
    }
    for (var i = fallingChunks.length - 1; i >= 0; i--) {
      scene.remove(fallingChunks[i].mesh);
    }
    for (var i = dustClouds.length - 1; i >= 0; i--) {
      dustClouds[i].particles.forEach(function(sphere) {
        scene.remove(sphere);
      });
    }

    meshes = [];
    cracks = [];
    fallingChunks = [];
    dustClouds = [];
    towerLean = 0;
    elapsedTime = 0;

    init(scene, camera);
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
