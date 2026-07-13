window.LavaFlow = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var lavaChannels = [];
  var lavaPools = [];
  var lavaSurfaces = [];
  var fountainParticles = [];
  var ashParticles = [];
  var shimmerPosts = [];
  var cooledLavaIslands = [];
  var lavaTime = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    // Ground base - cooled black volcanic rock
    var groundGeometry = new THREE.BoxGeometry(200, 2, 200);
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95,
      metalness: 0.1,
      emissive: 0x0a0a0a
    });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -10;
    ground.castShadow = true;
    ground.receiveShadow = true;
    scene.add(ground);

    // Main lava channel - glowing orange-red
    var mainChannelGeometry = new THREE.BoxGeometry(80, 3, 15);
    var lavaMaterial = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      emissive: 0xff4400,
      emissiveIntensity: 0.8,
      roughness: 0.4,
      metalness: 0.2
    });
    var mainChannel = new THREE.Mesh(mainChannelGeometry, lavaMaterial);
    mainChannel.position.set(-20, -8, 0);
    mainChannel.rotation.z = 0.15;
    mainChannel.castShadow = true;
    mainChannel.receiveShadow = true;
    scene.add(mainChannel);
    lavaChannels.push({ mesh: mainChannel, emissiveIntensity: 0.8 });

    // Secondary diagonal lava channel
    var secondChannelGeometry = new THREE.BoxGeometry(60, 2.5, 12);
    var secondChannel = new THREE.Mesh(secondChannelGeometry, lavaMaterial.clone());
    secondChannel.position.set(40, -7.5, 30);
    secondChannel.rotation.z = -0.25;
    secondChannel.castShadow = true;
    secondChannel.receiveShadow = true;
    scene.add(secondChannel);
    lavaChannels.push({ mesh: secondChannel, emissiveIntensity: 0.8 });

    // Lava pools - flat emissive surfaces
    var pool1Geometry = new THREE.BoxGeometry(35, 0.5, 45);
    var poolMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff5500,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.1
    });
    var pool1 = new THREE.Mesh(pool1Geometry, poolMaterial);
    pool1.position.set(-50, -5, 40);
    pool1.castShadow = true;
    pool1.receiveShadow = true;
    scene.add(pool1);
    lavaPools.push({ mesh: pool1, emissiveIntensity: 0.9 });
    lavaSurfaces.push(pool1);

    var pool2Geometry = new THREE.BoxGeometry(28, 0.5, 38);
    var pool2 = new THREE.Mesh(pool2Geometry, poolMaterial.clone());
    pool2.position.set(60, -6, -50);
    pool2.castShadow = true;
    pool2.receiveShadow = true;
    scene.add(pool2);
    lavaPools.push({ mesh: pool2, emissiveIntensity: 0.9 });
    lavaSurfaces.push(pool2);

    // Cooled lava crust bridges
    var crustMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1a0a,
      roughness: 0.9,
      metalness: 0.05,
      emissive: 0x1a0a00
    });
    var crust1Geometry = new THREE.BoxGeometry(25, 0.8, 15);
    var crust1 = new THREE.Mesh(crust1Geometry, crustMaterial);
    crust1.position.set(-20, -4, -25);
    crust1.rotation.z = 0.08;
    crust1.castShadow = true;
    crust1.receiveShadow = true;
    scene.add(crust1);

    var crust2Geometry = new THREE.BoxGeometry(20, 0.8, 12);
    var crust2 = new THREE.Mesh(crust2Geometry, crustMaterial.clone());
    crust2.position.set(35, -5.5, 15);
    crust2.rotation.z = -0.12;
    crust2.castShadow = true;
    crust2.receiveShadow = true;
    scene.add(crust2);

    // Safe rock islands - elevated platforms
    var islandMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.1,
      emissive: 0x0a0a0a
    });
    var island1Geometry = new THREE.BoxGeometry(18, 2, 18);
    var island1 = new THREE.Mesh(island1Geometry, islandMaterial);
    island1.position.set(-70, 0, -60);
    island1.castShadow = true;
    island1.receiveShadow = true;
    scene.add(island1);
    cooledLavaIslands.push(island1);

    var island2Geometry = new THREE.BoxGeometry(16, 2.2, 16);
    var island2 = new THREE.Mesh(island2Geometry, islandMaterial.clone());
    island2.position.set(80, 2, 70);
    island2.castShadow = true;
    island2.receiveShadow = true;
    scene.add(island2);
    cooledLavaIslands.push(island2);

    // Rope/cable bridge between islands
    var bridgeGeometry = new THREE.BoxGeometry(1, 0.3, 150);
    var bridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.6,
      metalness: 0.3
    });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(5, 3, 5);
    bridge.rotation.z = 0.2;
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    scene.add(bridge);

    // Partially melted fence sections
    var fenceGeometry = new THREE.BoxGeometry(2, 0.1, 35);
    var fenceMaterial = new THREE.MeshStandardMaterial({
      color: 0x442200,
      roughness: 0.7,
      metalness: 0.5,
      emissive: 0x220000
    });
    var fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
    fence.position.set(-90, -4, 20);
    fence.rotation.z = 0.25;
    fence.castShadow = true;
    fence.receiveShadow = true;
    scene.add(fence);

    // Abandoned vehicle sinking
    var vehicleBodyGeometry = new THREE.BoxGeometry(6, 2.5, 12);
    var vehicleMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.9,
      metalness: 0.4,
      emissive: 0x220000
    });
    var vehicleBody = new THREE.Mesh(vehicleBodyGeometry, vehicleMaterial);
    vehicleBody.position.set(50, -7, 60);
    vehicleBody.rotation.z = 0.3;
    vehicleBody.castShadow = true;
    vehicleBody.receiveShadow = true;
    scene.add(vehicleBody);

    var fireGeometry = new THREE.SphereGeometry(2, 8, 8);
    var fireMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff6600,
      emissiveIntensity: 1.0,
      roughness: 0.5,
      metalness: 0.0
    });
    var fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(50, -2, 60);
    fire.castShadow = true;
    fire.receiveShadow = true;
    scene.add(fire);

    // Military building half-consumed by lava
    var buildingGeometry = new THREE.BoxGeometry(30, 25, 20);
    var buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.85,
      metalness: 0.2,
      emissive: 0x1a0a00
    });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(-80, 5, -40);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);

    // Lava engulfing lower part
    var lavaEngulfGeometry = new THREE.BoxGeometry(32, 8, 22);
    var lavaEngulfMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: 0xff3300,
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0.15
    });
    var lavaEngulf = new THREE.Mesh(lavaEngulfGeometry, lavaEngulfMaterial);
    lavaEngulf.position.set(-80, -2, -40);
    lavaEngulf.castShadow = true;
    lavaEngulf.receiveShadow = true;
    scene.add(lavaEngulf);
    lavaChannels.push({ mesh: lavaEngulf, emissiveIntensity: 0.85 });

    // Volcanic cinder cone
    var coneGeometry = new THREE.ConeGeometry(25, 45, 16);
    var coneMaterial = new THREE.MeshStandardMaterial({
      color: 0x333322,
      roughness: 0.95,
      metalness: 0.05,
      emissive: 0x0a0a00
    });
    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(75, -5, -80);
    cone.castShadow = true;
    cone.receiveShadow = true;
    scene.add(cone);

    // Lava fountain spatter particles
    for (var i = 0; i < 12; i++) {
      var particleGeometry = new THREE.SphereGeometry(0.6, 4, 4);
      var particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff5500,
        emissiveIntensity: 0.95,
        roughness: 0.4,
        metalness: 0.1
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      var angle = (i / 12) * Math.PI * 2;
      particle.position.set(
        Math.cos(angle) * 8,
        -5 + Math.random() * 5,
        Math.sin(angle) * 8
      );
      particle.castShadow = true;
      particle.receiveShadow = true;
      scene.add(particle);
      fountainParticles.push({
        mesh: particle,
        baseY: particle.position.y,
        velocity: { x: 0, y: Math.random() * 3 + 2, z: 0 },
        lifetime: Math.random() * 2 + 1,
        age: 0,
        baseEmissive: 0.95
      });
    }

    // Emergency cooling pipe system
    var pipe1Geometry = new THREE.CylinderGeometry(1.2, 1.2, 80, 8);
    var pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      roughness: 0.6,
      metalness: 0.7,
      emissive: 0x112266
    });
    var pipe1 = new THREE.Mesh(pipe1Geometry, pipeMaterial);
    pipe1.position.set(-60, 15, -60);
    pipe1.rotation.z = 0.3;
    pipe1.castShadow = true;
    pipe1.receiveShadow = true;
    scene.add(pipe1);

    var pipe2Geometry = new THREE.CylinderGeometry(1, 1, 60, 8);
    var pipe2 = new THREE.Mesh(pipe2Geometry, pipeMaterial.clone());
    pipe2.position.set(40, 12, 50);
    pipe2.rotation.x = 0.4;
    pipe2.castShadow = true;
    pipe2.receiveShadow = true;
    scene.add(pipe2);

    // Fire suppression sprinkler head
    var sprinklerHeadGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    var sprinklerMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.4,
      metalness: 0.8,
      emissive: 0x333333
    });
    var sprinklerHead = new THREE.Mesh(sprinklerHeadGeometry, sprinklerMaterial);
    sprinklerHead.position.set(-30, 20, 10);
    sprinklerHead.castShadow = true;
    sprinklerHead.receiveShadow = true;
    scene.add(sprinklerHead);

    // Sprinkler spray arm
    var sprayGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 6);
    var sprayMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.5,
      metalness: 0.8
    });
    var spray = new THREE.Mesh(sprayGeometry, sprayMaterial);
    spray.position.set(-30, 18, 10);
    spray.rotation.z = 0.8;
    spray.castShadow = true;
    spray.receiveShadow = true;
    scene.add(spray);

    // Heat shimmer posts
    for (var j = 0; j < 4; j++) {
      var shimmerGeometry = new THREE.CylinderGeometry(1.5, 1.5, 35, 8);
      var shimmerMaterial = new THREE.MeshStandardMaterial({
        color: 0x664400,
        roughness: 0.8,
        metalness: 0.2,
        emissive: 0x220000
      });
      var shimmer = new THREE.Mesh(shimmerGeometry, shimmerMaterial);
      var posX = -70 + j * 50;
      shimmer.position.set(posX, 5, 30 + j * 15);
      shimmer.castShadow = true;
      shimmer.receiveShadow = true;
      scene.add(shimmer);
      shimmerPosts.push({ mesh: shimmer, baseColor: 0x664400 });
    }

    // Ash particles falling
    for (var k = 0; k < 40; k++) {
      var ashGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var ashMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.95,
        metalness: 0.0,
        emissive: 0x222222
      });
      var ash = new THREE.Mesh(ashGeometry, ashMaterial);
      ash.position.set(
        Math.random() * 160 - 80,
        Math.random() * 100,
        Math.random() * 160 - 80
      );
      ash.castShadow = true;
      ash.receiveShadow = true;
      scene.add(ash);
      ashParticles.push({
        mesh: ash,
        baseY: ash.position.y,
        fallSpeed: Math.random() * 0.5 + 0.2,
        rotation: { x: Math.random() * 0.1, y: Math.random() * 0.1 }
      });
    }

    // Survival shelter on high ground
    var shelterGeometry = new THREE.BoxGeometry(15, 8, 12);
    var shelterMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc8844,
      roughness: 0.7,
      metalness: 0.1,
      emissive: 0x330000
    });
    var shelter = new THREE.Mesh(shelterGeometry, shelterMaterial);
    shelter.position.set(75, 12, -75);
    shelter.castShadow = true;
    shelter.receiveShadow = true;
    scene.add(shelter);

    // Warning signs on fire
    var signGeometry = new THREE.BoxGeometry(3, 4, 0.5);
    var signMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.8,
      metalness: 0.3,
      emissive: 0x330000
    });
    var sign1 = new THREE.Mesh(signGeometry, signMaterial);
    sign1.position.set(0, 8, 60);
    sign1.castShadow = true;
    sign1.receiveShadow = true;
    scene.add(sign1);

    var sign2 = new THREE.Mesh(signGeometry.clone(), signMaterial.clone());
    sign2.position.set(-50, 10, -30);
    sign2.castShadow = true;
    sign2.receiveShadow = true;
    scene.add(sign2);

    // Ambient lighting for lava glow
    var lavaBluLight = new THREE.PointLight(0xff4400, 2, 200);
    lavaBluLight.position.set(-20, 15, 0);
    scene.add(lavaBluLight);

    var lavaBluLight2 = new THREE.PointLight(0xff6600, 2, 180);
    lavaBluLight2.position.set(60, 12, -50);
    scene.add(lavaBluLight2);
  }

  function update(delta) {
    lavaTime += delta;

    // Lava surface shimmer - emissive intensity oscillation
    for (var i = 0; i < lavaChannels.length; i++) {
      var channel = lavaChannels[i];
      var shimmer = Math.sin(lavaTime * 3 + i) * 0.15;
      channel.mesh.material.emissiveIntensity = channel.emissiveIntensity + shimmer;
    }

    // Lava pools shimmer
    for (var p = 0; p < lavaPools.length; p++) {
      var pool = lavaPools[p];
      var poolShimmer = Math.sin(lavaTime * 2.5 + p * 0.5) * 0.12;
      pool.mesh.material.emissiveIntensity = pool.emissiveIntensity + poolShimmer;

      // Gentle surface undulation
      pool.mesh.position.y += Math.sin(lavaTime * 1.5 + p) * 0.002;
    }

    // Fountain particle burst animation
    for (var f = 0; f < fountainParticles.length; f++) {
      var fParticle = fountainParticles[f];
      fParticle.age += delta;

      var progress = fParticle.age / fParticle.lifetime;
      if (progress > 1) {
        fParticle.age = 0;
        progress = 0;
      }

      var gravity = 15;
      fParticle.velocity.y -= gravity * delta;
      fParticle.mesh.position.y += fParticle.velocity.y * delta;
      fParticle.mesh.position.x += fParticle.velocity.x * delta;
      fParticle.mesh.position.z += fParticle.velocity.z * delta;

      // Emissive fade
      fParticle.mesh.material.emissiveIntensity = fParticle.baseEmissive * (1 - progress);

      if (fParticle.mesh.position.y < -15) {
        fParticle.mesh.position.y = fParticle.baseY;
        fParticle.age = 0;
        fParticle.velocity.y = Math.random() * 3 + 2;
      }
    }

    // Ash particle falling
    for (var a = 0; a < ashParticles.length; a++) {
      var ashPart = ashParticles[a];
      ashPart.mesh.position.y -= ashPart.fallSpeed;
      ashPart.mesh.rotation.x += ashPart.rotation.x * 0.5;
      ashPart.mesh.rotation.y += ashPart.rotation.y * 0.3;

      if (ashPart.mesh.position.y < -15) {
        ashPart.mesh.position.y = ashPart.baseY;
      }
    }

    // Heat shimmer posts glow variation
    for (var s = 0; s < shimmerPosts.length; s++) {
      var shimmerPost = shimmerPosts[s];
      var heatGlow = Math.sin(lavaTime * 2 + s) * 0.08;
      shimmerPost.mesh.material.emissiveIntensity = 0.3 + heatGlow;
    }

    // Lava channel slow creep animation
    for (var c = 0; c < lavaChannels.length; c++) {
      var channelMesh = lavaChannels[c].mesh;
      if (c === 0) {
        channelMesh.position.x += Math.sin(lavaTime * 0.3) * 0.01;
      } else if (c === 1) {
        channelMesh.position.z += Math.sin(lavaTime * 0.25) * 0.012;
      }
    }

    // Cooled lava islands subtle vibration from heat
    for (var isIdx = 0; isIdx < cooledLavaIslands.length; isIdx++) {
      var island = cooledLavaIslands[isIdx];
      island.position.y += Math.sin(lavaTime * 1.2 + isIdx) * 0.001;
    }
  }

  function reset() {
    lavaTime = 0;

    // Reset all lava surfaces to initial emissive intensity
    for (var i = 0; i < lavaChannels.length; i++) {
      lavaChannels[i].mesh.material.emissiveIntensity = lavaChannels[i].emissiveIntensity;
    }

    for (var p = 0; p < lavaPools.length; p++) {
      lavaPools[p].mesh.material.emissiveIntensity = lavaPools[p].emissiveIntensity;
    }

    // Reset fountain particles
    for (var f = 0; f < fountainParticles.length; f++) {
      var fParticle = fountainParticles[f];
      fParticle.age = 0;
      fParticle.mesh.position.y = fParticle.baseY;
      fParticle.velocity.y = Math.random() * 3 + 2;
    }

    // Reset ash particles
    for (var a = 0; a < ashParticles.length; a++) {
      var ashPart = ashParticles[a];
      ashPart.mesh.position.y = ashPart.baseY;
    }

    // Reset lava channels position
    for (var c = 0; c < lavaChannels.length; c++) {
      if (c === 0) lavaChannels[c].mesh.position.x = -20;
      else if (c === 1) lavaChannels[c].mesh.position.z = 30;
    }

    // Reset cooled lava islands
    for (var isIdx = 0; isIdx < cooledLavaIslands.length; isIdx++) {
      cooledLavaIslands[isIdx].position.y = isIdx === 0 ? 0 : 2;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
