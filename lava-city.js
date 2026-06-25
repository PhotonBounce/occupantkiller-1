window.LavaCity = (function() {
  'use strict';

  var scene;
  var camera;
  var lavaLight;
  var ashParticles = [];
  var fireFlickerObjects = [];
  var pulseLights = [];
  var time = 0;
  var baseColorLava = 0xFF6B1A;
  var baseColorObsidian = 0x2C2C2C;
  var baseColorMetal = 0xB0B0B0;
  var baseColorConcrete = 0x808080;
  var baseColorBrick = 0xA0522D;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    time = 0;
    ashParticles = [];
    fireFlickerObjects = [];
    pulseLights = [];

    // Scene fog and environment
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x3d3d3d, 120, 200);

    // Main lava ambient light with pulsing effect
    lavaLight = new THREE.PointLight(0xFF6B1A, 1.2, 150);
    lavaLight.position.set(40, 15, 40);
    scene.add(lavaLight);
    pulseLights.push(lavaLight);

    // Secondary lava light for depth
    var lavaLight2 = new THREE.PointLight(0xFF4500, 0.8, 120);
    lavaLight2.position.set(-40, 12, -40);
    scene.add(lavaLight2);
    pulseLights.push(lavaLight2);

    // Ambient light for base illumination
    var ambient = new THREE.AmbientLight(0x6B4423, 0.6);
    scene.add(ambient);

    buildEnvironment();
    initializeParticles();
  }

  function buildEnvironment() {
    // ===== LAVA RIVERS AND STREETS =====
    var lavaRiver1 = new THREE.Mesh(
      new THREE.BoxGeometry(60, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: baseColorLava, emissive: 0xFF4500, emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.1 })
    );
    lavaRiver1.position.set(0, 0.75, 0);
    scene.add(lavaRiver1);
    fireFlickerObjects.push(lavaRiver1);

    var lavaRiver2 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1.5, 60),
      new THREE.MeshStandardMaterial({ color: baseColorLava, emissive: 0xFF6B1A, emissiveIntensity: 0.6, roughness: 0.35, metalness: 0.1 })
    );
    lavaRiver2.position.set(0, 0.75, 0);
    scene.add(lavaRiver2);
    fireFlickerObjects.push(lavaRiver2);

    // ===== COLLAPSED BUILDING 1 - Northeast Corner =====
    var bldg1Base = new THREE.Mesh(
      new THREE.BoxGeometry(18, 2, 18),
      new THREE.MeshStandardMaterial({ color: baseColorConcrete, roughness: 0.8 })
    );
    bldg1Base.position.set(35, 1, 35);
    scene.add(bldg1Base);

    var bldg1Wall1 = new THREE.Mesh(
      new THREE.BoxGeometry(18, 12, 3),
      new THREE.MeshStandardMaterial({ color: baseColorBrick, roughness: 0.75 })
    );
    bldg1Wall1.position.set(35, 7, 41.5);
    scene.add(bldg1Wall1);

    var bldg1Wall2 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 12, 18),
      new THREE.MeshStandardMaterial({ color: baseColorBrick, roughness: 0.75 })
    );
    bldg1Wall2.position.set(41.5, 7, 35);
    scene.add(bldg1Wall2);

    // Glowing windows
    var window1 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xFFA500, emissive: 0xFF6B1A, emissiveIntensity: 0.8, roughness: 0.2 })
    );
    window1.position.set(32, 10, 41.7);
    scene.add(window1);
    fireFlickerObjects.push(window1);

    var window2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xFFA500, emissive: 0xFF6B1A, emissiveIntensity: 0.75, roughness: 0.2 })
    );
    window2.position.set(38, 8, 41.7);
    scene.add(window2);
    fireFlickerObjects.push(window2);

    // ===== MILITARY PLATFORM BRIDGE 1 =====
    var platform1 = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.8, 6),
      new THREE.MeshStandardMaterial({ color: baseColorMetal, roughness: 0.4, metalness: 0.8 })
    );
    platform1.position.set(0, 8, 25);
    scene.add(platform1);

    var platformSupport1a = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.8, 7.5, 8),
      new THREE.MeshStandardMaterial({ color: baseColorMetal, roughness: 0.5, metalness: 0.7 })
    );
    platformSupport1a.position.set(-18, 4.5, 25);
    scene.add(platformSupport1a);

    var platformSupport1b = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.8, 7.5, 8),
      new THREE.MeshStandardMaterial({ color: baseColorMetal, roughness: 0.5, metalness: 0.7 })
    );
    platformSupport1b.position.set(18, 4.5, 25);
    scene.add(platformSupport1b);

    // ===== OBSIDIAN-COATED BUNKER 1 =====
    var bunker1 = new THREE.Mesh(
      new THREE.BoxGeometry(14, 8, 12),
      new THREE.MeshStandardMaterial({ color: baseColorObsidian, roughness: 0.6, metalness: 0.4 })
    );
    bunker1.position.set(-35, 4, 35);
    scene.add(bunker1);

    var bunkerDoor1 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8, metalness: 0.5 })
    );
    bunkerDoor1.position.set(-35, 4, 41.5);
    scene.add(bunkerDoor1);

    // ===== LAVA BOMBS (Frozen hardened spheres) =====
    var lavaBomb1 = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9, metalness: 0.2 })
    );
    lavaBomb1.position.set(20, 12, -30);
    lavaBomb1.castShadow = true;
    scene.add(lavaBomb1);

    var lavaBomb2 = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9, metalness: 0.1 })
    );
    lavaBomb2.position.set(-25, 10, 20);
    scene.add(lavaBomb2);

    var lavaBomb3 = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.85, metalness: 0.2 })
    );
    lavaBomb3.position.set(30, 8, 30);
    scene.add(lavaBomb3);

    // ===== FIRE SUPPRESSION TOWERS (Failed) =====
    var tower1Base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 2, 8),
      new THREE.MeshStandardMaterial({ color: baseColorMetal, roughness: 0.6, metalness: 0.6 })
    );
    tower1Base.position.set(-40, 1, -35);
    scene.add(tower1Base);

    var tower1Shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 18, 8),
      new THREE.MeshStandardMaterial({ color: baseColorMetal, roughness: 0.5, metalness: 0.7 })
    );
    tower1Shaft.position.set(-40, 10, -35);
    scene.add(tower1Shaft);

    var tower1Head = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 3, 8),
      new THREE.MeshStandardMaterial({ color: baseColorMetal, roughness: 0.7, metalness: 0.5 })
    );
    tower1Head.position.set(-40, 20, -35);
    scene.add(tower1Head);

    var tower2Base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 2, 8),
      new THREE.MeshStandardMaterial({ color: baseColorMetal, roughness: 0.6, metalness: 0.6 })
    );
    tower2Base.position.set(40, 1, -40);
    scene.add(tower2Base);

    var tower2Shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 16, 8),
      new THREE.MeshStandardMaterial({ color: baseColorMetal, roughness: 0.5, metalness: 0.7 })
    );
    tower2Shaft.position.set(40, 9, -40);
    scene.add(tower2Shaft);

    var tower2Head = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 2.8, 8),
      new THREE.MeshStandardMaterial({ color: baseColorMetal, roughness: 0.7, metalness: 0.5 })
    );
    tower2Head.position.set(40, 18, -40);
    scene.add(tower2Head);

    // ===== RESCUE HELICOPTER PAD =====
    var padBase = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1, 16),
      new THREE.MeshStandardMaterial({ color: 0xFFCC00, roughness: 0.5, metalness: 0.3 })
    );
    padBase.position.set(-35, 22, -35);
    scene.add(padBase);

    var padMarking1 = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.3, 1),
      new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.8 })
    );
    padMarking1.position.set(-35, 22.5, -35);
    scene.add(padMarking1);

    var padMarking2 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.8 })
    );
    padMarking2.position.set(-35, 22.5, -35);
    scene.add(padMarking2);

    // ===== ASH-COVERED VEHICLES =====
    var vehicle1Hull = new THREE.Mesh(
      new THREE.BoxGeometry(6, 2.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.85 })
    );
    vehicle1Hull.position.set(15, 1.5, -20);
    scene.add(vehicle1Hull);

    var vehicle1Cab = new THREE.Mesh(
      new THREE.BoxGeometry(6, 2, 4),
      new THREE.MeshStandardMaterial({ color: 0x707070, roughness: 0.8 })
    );
    vehicle1Cab.position.set(15, 3, -26);
    scene.add(vehicle1Cab);

    var vehicle2Hull = new THREE.Mesh(
      new THREE.BoxGeometry(8, 2, 10),
      new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.9 })
    );
    vehicle2Hull.position.set(-20, 1, 10);
    scene.add(vehicle2Hull);

    // ===== EMERGENCY BARRICADES =====
    var barricade1A = new THREE.Mesh(
      new THREE.BoxGeometry(8, 2, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.7, metalness: 0.3 })
    );
    barricade1A.position.set(25, 1, -15);
    scene.add(barricade1A);

    var barricade1B = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 2, 6),
      new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.7, metalness: 0.3 })
    );
    barricade1B.position.set(29, 1, -12);
    scene.add(barricade1B);

    var barricade2A = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1.5, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.75, metalness: 0.2 })
    );
    barricade2A.position.set(-28, 0.75, 28);
    scene.add(barricade2A);

    // ===== DEBRIS PILES =====
    var debris1a = new THREE.Mesh(
      new THREE.BoxGeometry(5, 2, 4),
      new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.95 })
    );
    debris1a.position.set(-15, 1, -25);
    debris1a.rotation.z = 0.3;
    scene.add(debris1a);

    var debris1b = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.5, 5),
      new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.92 })
    );
    debris1b.position.set(-12, 2.2, -26);
    debris1b.rotation.z = -0.4;
    scene.add(debris1b);

    var debris2a = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1.8, 3),
      new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9 })
    );
    debris2a.position.set(33, 1, -12);
    debris2a.rotation.z = 0.5;
    scene.add(debris2a);

    // ===== LAVA BARRIERS =====
    var lavaBarrier1 = new THREE.Mesh(
      new THREE.BoxGeometry(14, 3, 2),
      new THREE.MeshStandardMaterial({ color: 0x8B4513, emissive: 0xFF4500, emissiveIntensity: 0.4, roughness: 0.65 })
    );
    lavaBarrier1.position.set(-20, 1.5, -32);
    scene.add(lavaBarrier1);
    fireFlickerObjects.push(lavaBarrier1);

    var lavaBarrier2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3, 12),
      new THREE.MeshStandardMaterial({ color: 0x8B4513, emissive: 0xFF4500, emissiveIntensity: 0.35, roughness: 0.68 })
    );
    lavaBarrier2.position.set(32, 1.5, 10);
    scene.add(lavaBarrier2);
    fireFlickerObjects.push(lavaBarrier2);

    // ===== BUILDING CORNER COVER 1 =====
    var cornerBldgBase = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1.5, 10),
      new THREE.MeshStandardMaterial({ color: baseColorConcrete, roughness: 0.8 })
    );
    cornerBldgBase.position.set(25, 0.75, -35);
    scene.add(cornerBldgBase);

    var cornerWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 10, 2),
      new THREE.MeshStandardMaterial({ color: baseColorBrick, roughness: 0.75 })
    );
    cornerWall1.position.set(25, 5.5, -40);
    scene.add(cornerWall1);

    var cornerWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 10, 10),
      new THREE.MeshStandardMaterial({ color: baseColorBrick, roughness: 0.75 })
    );
    cornerWall2.position.set(30, 5.5, -35);
    scene.add(cornerWall2);

    // ===== ELEVATED PLATFORM WITH SANDBAGS =====
    var platform2 = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.8, 20),
      new THREE.MeshStandardMaterial({ color: baseColorConcrete, roughness: 0.85 })
    );
    platform2.position.set(-35, 12, 10);
    scene.add(platform2);

    var sandbag1 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.2, 1.5),
      new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.95 })
    );
    sandbag1.position.set(-40, 12.8, 15);
    scene.add(sandbag1);

    var sandbag2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xCDA870, roughness: 0.95 })
    );
    sandbag2.position.set(-30, 12.8, 18);
    scene.add(sandbag2);

    // ===== ROOFTOP SAFE ZONE STRUCTURE =====
    var roofStructure = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.6, metalness: 0.5 })
    );
    roofStructure.position.set(35, 18, -10);
    scene.add(roofStructure);

    var roofCover1 = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.3, 2),
      new THREE.MeshStandardMaterial({ color: baseColorMetal, roughness: 0.5, metalness: 0.7 })
    );
    roofCover1.position.set(35, 18.5, -16);
    scene.add(roofCover1);

    var roofCover2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: baseColorMetal, roughness: 0.5, metalness: 0.7 })
    );
    roofCover2.position.set(42, 18.5, -10);
    scene.add(roofCover2);

    // ===== CRUMBLING STRUCTURE (Vertical pieces indicating collapse) =====
    var crumbleA = new THREE.Mesh(
      new THREE.BoxGeometry(2, 8, 2),
      new THREE.MeshStandardMaterial({ color: baseColorBrick, roughness: 0.8 })
    );
    crumbleA.position.set(10, 4, 35);
    crumbleA.rotation.z = 0.4;
    scene.add(crumbleA);

    var crumbleB = new THREE.Mesh(
      new THREE.BoxGeometry(3, 6, 1.5),
      new THREE.MeshStandardMaterial({ color: baseColorConcrete, roughness: 0.85 })
    );
    crumbleB.position.set(13, 3.5, 38);
    crumbleB.rotation.z = -0.35;
    scene.add(crumbleB);
  }

  function initializeParticles() {
    // Create ash particles
    var particleCount = 80;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(particleCount * 3);
    var velocities = new Float32Array(particleCount * 3);

    for (var i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      velocities[i * 3] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 1] = Math.random() * 0.03 - 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var material = new THREE.PointsMaterial({
      color: 0x8a8a8a,
      size: 0.4,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    });

    var particles = new THREE.Points(geometry, material);
    scene.add(particles);

    ashParticles.push({
      mesh: particles,
      positions: positions,
      velocities: velocities
    });
  }

  function update(delta) {
    time += delta;

    // Pulse lava lights
    for (var i = 0; i < pulseLights.length; i++) {
      var pulseFactor = 0.8 + Math.sin(time * 1.5 + i * Math.PI) * 0.4;
      pulseLights[i].intensity = pulseFactor;
    }

    // Flicker fire effect on emissive objects
    var flicker = 0.4 + Math.sin(time * 4.5) * 0.3 + Math.random() * 0.2;
    for (var j = 0; j < fireFlickerObjects.length; j++) {
      fireFlickerObjects[j].material.emissiveIntensity = flicker;
    }

    // Update ash particles
    for (var k = 0; k < ashParticles.length; k++) {
      var particle = ashParticles[k];
      var positions = particle.positions;
      var velocities = particle.velocities;
      var posAttr = particle.mesh.geometry.attributes.position;

      for (var p = 0; p < positions.length; p += 3) {
        positions[p] += velocities[p];
        positions[p + 1] += velocities[p + 1];
        positions[p + 2] += velocities[p + 2];

        // Wrap particles
        if (positions[p] > 40) positions[p] = -40;
        if (positions[p] < -40) positions[p] = 40;
        if (positions[p + 1] > 50) positions[p + 1] = 0;
        if (positions[p + 1] < 0) positions[p + 1] = 50;
        if (positions[p + 2] > 40) positions[p + 2] = -40;
        if (positions[p + 2] < -40) positions[p + 2] = 40;
      }
      posAttr.needsUpdate = true;
    }
  }

  function reset() {
    time = 0;
    for (var i = 0; i < ashParticles.length; i++) {
      var positions = ashParticles[i].positions;
      for (var j = 0; j < positions.length; j += 3) {
        positions[j] = (Math.random() - 0.5) * 80;
        positions[j + 1] = Math.random() * 40;
        positions[j + 2] = (Math.random() - 0.5) * 80;
      }
      ashParticles[i].mesh.geometry.attributes.position.needsUpdate = true;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
