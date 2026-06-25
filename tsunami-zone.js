window.TsunamiZone = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lights = [];
  var particles = [];
  var survivors = [];
  var looters = [];
  var waterTiles = [];
  var debrisObjects = [];
  var time = 0;

  var colors = {
    water: 0x1E5F8A,
    mud: 0x6B4226,
    debris: 0x777777,
    fire: 0xFF5500,
    sky: 0xC8D8E8,
    structure: 0xDDDDDD
  };

  function createBoxMesh(width, height, depth, color, x, y, z, rotX, rotY, rotZ) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rotX || 0, rotY || 0, rotZ || 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createCylinderMesh(radiusTop, radiusBottom, height, color, x, y, z, rotX, rotY) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 8);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rotX || 0, rotY || 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createSphereMesh(radius, color, x, y, z) {
    var geometry = new THREE.SphereGeometry(radius, 8, 8);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createConeMesh(radius, height, color, x, y, z, rotX) {
    var geometry = new THREE.ConeGeometry(radius, height, 8);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.x = rotX || 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    lights = [];
    particles = [];
    survivors = [];
    looters = [];
    waterTiles = [];
    debrisObjects = [];
    time = 0;

    // Ground - mud and silt
    var groundTile = createBoxMesh(120, 0.5, 120, colors.mud, 0, -0.25, 0);

    // Flooded water tiles
    for (var wx = -60; wx < 60; wx += 20) {
      for (var wz = -60; wz < 60; wz += 20) {
        var waterTile = createBoxMesh(20, 3, 20, colors.water, wx + 10, 1.5, wz + 10);
        waterTile.userData.originalY = 1.5;
        waterTiles.push(waterTile);
      }
    }

    // Partially collapsed buildings
    var buildingA = createBoxMesh(25, 18, 20, colors.structure, -40, 9, -30, 0, 0, 0.2);
    var buildingB = createBoxMesh(20, 12, 25, colors.structure, 35, 6, -20, -0.1, 0, 0);
    var roofA = createBoxMesh(26, 0.8, 21, colors.debris, -40, 18.4, -30, 0.15, 0, 0.1);
    var roofB = createBoxMesh(21, 0.8, 26, colors.debris, 35, 12.4, -20, 0, 0, -0.12);

    // Debris stacks
    var debrisStack1 = createBoxMesh(8, 6, 4, colors.debris, -25, 3, 15, 0.3, 0.2, 0);
    debrisObjects.push(debrisStack1);
    var debrisStack2 = createBoxMesh(6, 5, 7, colors.debris, 20, 2.5, 10, -0.15, 0, 0.25);
    debrisObjects.push(debrisStack2);
    var debrisStack3 = createBoxMesh(10, 4, 5, colors.debris, 10, 2, -35, 0.1, -0.1, 0);
    debrisObjects.push(debrisStack3);

    // Tilted utility poles
    var poleA = createCylinderMesh(0.4, 0.3, 22, colors.debris, -50, 11, 25, 0.35, 0);
    var poleB = createCylinderMesh(0.35, 0.25, 20, colors.debris, 45, 10, -40, -0.3, 0);
    var poleC = createCylinderMesh(0.4, 0.35, 18, colors.debris, 0, 9, 45, 0.25, 0);
    var poleD = createCylinderMesh(0.35, 0.3, 20, colors.debris, -60, 10, 0, -0.28, 0);

    // Stranded vehicles
    var carBody = createBoxMesh(4.5, 2.2, 8, 0x2C3E50, -35, 2, 25, 0.5, 0, 0);
    var carWheel1 = createCylinderMesh(0.9, 0.9, 1.6, 0x1a1a1a, -37.5, 1.2, 27, Math.PI / 2, 0);
    var carWheel2 = createCylinderMesh(0.9, 0.9, 1.6, 0x1a1a1a, -32.5, 1.2, 27, Math.PI / 2, 0);
    var truckBed = createBoxMesh(5, 3, 12, 0x8B4513, 50, 1.5, 15, 0.6, 0, 0);

    // Boat washed inland
    var boatHull = createBoxMesh(6, 3, 15, 0x4A6FA5, 25, 2, -10, 0.4, 0.1, 0);
    var boatCabin = createBoxMesh(3.5, 3, 4, colors.structure, 26, 4, -8, 0.2, 0, 0);

    // Collapsed pier
    var pierSupport1 = createCylinderMesh(0.8, 0.7, 6, colors.debris, -10, 3, -50, 0, 0);
    var pierSupport2 = createCylinderMesh(0.8, 0.7, 5.5, colors.debris, -5, 2.5, -50, 0.2, 0);
    var pierSupport3 = createCylinderMesh(0.8, 0.7, 5, colors.debris, 0, 2, -50, -0.15, 0);
    var pierPlank1 = createBoxMesh(12, 0.6, 3, colors.debris, -7.5, 6.2, -45, 0.3, 0, 0);
    var pierPlank2 = createBoxMesh(12, 0.5, 3, colors.debris, -7.5, 4.5, -55, -0.25, 0, 0);

    // Survival camp with tents
    var tentPole1 = createCylinderMesh(0.25, 0.25, 4, colors.debris, 60, 2, 30, 0, 0);
    var tentPole2 = createCylinderMesh(0.25, 0.25, 4, colors.debris, 70, 2, 30, 0, 0);
    var tentCloth = createConeMesh(7, 4, 0xE8D7C3, 65, 4, 30, 0);
    var campFire = createCylinderMesh(1.5, 1.5, 2, colors.mud, 65, 1, 40);

    // Fire logs
    var logA = createCylinderMesh(0.3, 0.3, 4, 0x3E2723, 63, 2.5, 40, 0.6, 0);
    var logB = createCylinderMesh(0.3, 0.3, 4, 0x3E2723, 67, 2.5, 40, -0.5, 0);

    // Debris pile mountain
    var debrisHeap1 = createBoxMesh(18, 8, 15, colors.debris, -30, 4, 40, 0.4, 0.3, -0.2);
    var debrisHeap2 = createBoxMesh(12, 5, 10, colors.debris, -28, 8, 42, 0.2, -0.1, 0.1);
    debrisObjects.push(debrisHeap1);
    debrisObjects.push(debrisHeap2);

    // More destroyed infrastructure
    var wallFragment1 = createBoxMesh(15, 8, 1.5, colors.structure, -60, 4, 10, 0, 0.15, 0);
    var wallFragment2 = createBoxMesh(1.5, 10, 20, colors.structure, 55, 5, 5, -0.1, 0, 0);
    var windowlessFrame = createBoxMesh(8, 0.8, 6, colors.structure, 15, 8, -45, 0.2, 0, 0);

    // Gas leak fire - flickering light source
    var fireLight = new THREE.PointLight(colors.fire, 1.2, 40);
    fireLight.position.set(0, 5, 35);
    fireLight.castShadow = true;
    scene.add(fireLight);
    lights.push(fireLight);

    // Fire visualization
    var fireGlow = createSphereMesh(3, colors.fire, 0, 5, 35);
    fireGlow.userData.isFireGlow = true;

    // Ambient light
    var ambientLight = new THREE.AmbientLight(colors.sky, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Directional light (overcast sky)
    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    directionalLight.position.set(40, 50, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    lights.push(directionalLight);

    // Fog for atmosphere
    scene.fog = new THREE.Fog(colors.sky, 200, 400);

    // Create survivor objects
    for (var s = 0; s < 4; s++) {
      var survivorX = (Math.random() - 0.5) * 80;
      var survivorZ = (Math.random() - 0.5) * 80;
      var survivorHead = createSphereMesh(0.6, 0xF4A460, survivorX, 5, survivorZ);
      survivorHead.userData.isSurvivor = true;
      survivorHead.userData.wavePhase = Math.random() * Math.PI * 2;
      survivors.push(survivorHead);
    }

    // Create looter patrols
    for (var l = 0; l < 3; l++) {
      var looterX = (Math.random() - 0.5) * 80;
      var looterZ = (Math.random() - 0.5) * 80;
      var looterHead = createSphereMesh(0.7, 0x333333, looterX, 4.5, looterZ);
      looterHead.userData.isLooter = true;
      looterHead.userData.patrolTime = Math.random() * Math.PI * 2;
      looterHead.userData.patrolRadius = 15 + Math.random() * 15;
      looterHead.userData.originalX = looterX;
      looterHead.userData.originalZ = looterZ;
      looters.push(looterHead);
    }

    // Helicopter in distance
    var helicopterBody = createBoxMesh(4, 2, 8, 0x4A4A4A, -70, 45, -60);
    var helicopterRotor = createCylinderMesh(12, 12, 0.5, 0x777777, -70, 47, -60);
    helicopterRotor.userData.isRotor = true;
    helicopterRotor.userData.rotationSpeed = 0.3;

    return {
      meshCount: meshes.length,
      waterCount: waterTiles.length
    };
  }

  function update(delta) {
    time += delta;

    // Water surface shimmer
    for (var w = 0; w < waterTiles.length; w++) {
      var tile = waterTiles[w];
      var waveOffsetX = Math.sin(time * 1.2 + tile.position.x * 0.02) * 0.15;
      var waveOffsetZ = Math.cos(time * 0.9 + tile.position.z * 0.02) * 0.15;
      tile.position.y = tile.userData.originalY + waveOffsetX + waveOffsetZ;
    }

    // Fire flicker
    for (var fl = 0; fl < lights.length; fl++) {
      var light = lights[fl];
      if (light instanceof THREE.PointLight) {
        var flicker = 0.8 + Math.sin(time * 8) * 0.2 + Math.random() * 0.1;
        light.intensity = 1.2 * flicker;
      }
    }

    // Fire glow pulse
    for (var fg = 0; fg < meshes.length; fg++) {
      var mesh = meshes[fg];
      if (mesh.userData && mesh.userData.isFireGlow) {
        var pulseScale = 1.0 + Math.sin(time * 6) * 0.3;
        mesh.scale.set(pulseScale, pulseScale, pulseScale);
      }
    }

    // Survivors waving
    for (var sv = 0; sv < survivors.length; sv++) {
      var survivor = survivors[sv];
      survivor.userData.wavePhase += delta * 2;
      survivor.position.y = 5 + Math.sin(survivor.userData.wavePhase) * 0.8;
    }

    // Looter patrols
    for (var lp = 0; lp < looters.length; lp++) {
      var looter = looters[lp];
      looter.userData.patrolTime += delta * 0.5;
      var patrolX = looter.userData.originalX + Math.cos(looter.userData.patrolTime) * looter.userData.patrolRadius;
      var patrolZ = looter.userData.originalZ + Math.sin(looter.userData.patrolTime) * looter.userData.patrolRadius;
      looter.position.x = patrolX;
      looter.position.z = patrolZ;
    }

    // Helicopter rotor spin
    for (var h = 0; h < meshes.length; h++) {
      var rotor = meshes[h];
      if (rotor.userData && rotor.userData.isRotor) {
        rotor.rotation.z += delta * rotor.userData.rotationSpeed;
      }
    }

    // Debris settling (slight bobbing)
    for (var d = 0; d < debrisObjects.length; d++) {
      var debris = debrisObjects[d];
      if (!debris.userData.originalY) {
        debris.userData.originalY = debris.position.y;
      }
      var bobOffset = Math.sin(time * 0.8 + d) * 0.3;
      debris.position.y = debris.userData.originalY + bobOffset;
      debris.rotation.z += Math.sin(time * 0.3) * 0.001;
    }
  }

  function reset() {
    for (var m = 0; m < meshes.length; m++) {
      scene.remove(meshes[m]);
    }
    for (var l = 0; l < lights.length; l++) {
      scene.remove(lights[l]);
    }

    meshes = [];
    lights = [];
    particles = [];
    survivors = [];
    looters = [];
    waterTiles = [];
    debrisObjects = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
