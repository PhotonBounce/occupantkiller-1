window.CrystalPalace = (function() {
  'use strict';

  // Module state
  var scene = null;
  var objects = [];
  var animationFrameId = null;
  var startTime = Date.now();
  var elapsedTime = 0;

  // Initialize the game
  var init = function(parentScene) {
    scene = parentScene;
    objects = [];
    startTime = Date.now();

    // Create 15+ scene objects with alien crystalline palace theme

    // 1. Central Crystal Spire - main towering structure
    var spireGeometry = new THREE.ConeGeometry(3, 25, 8);
    var spireMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      shininess: 100,
      transparent: true,
      opacity: 0.85
    });
    var spire = new THREE.Mesh(spireGeometry, spireMaterial);
    spire.position.set(0, 12.5, 0);
    spire.castShadow = true;
    spire.receiveShadow = true;
    scene.add(spire);
    objects.push({ mesh: spire, type: 'spire' });

    // 2. Surrounding Spire Cluster 1
    var spire2Geometry = new THREE.ConeGeometry(1.5, 18, 6);
    var spire2 = new THREE.Mesh(spire2Geometry, spireMaterial);
    spire2.position.set(8, 9, 5);
    spire2.castShadow = true;
    scene.add(spire2);
    objects.push({ mesh: spire2, type: 'spire' });

    // 3. Surrounding Spire Cluster 2
    var spire3 = new THREE.Mesh(spire2Geometry, spireMaterial);
    spire3.position.set(-8, 9, 5);
    spire3.castShadow = true;
    scene.add(spire3);
    objects.push({ mesh: spire3, type: 'spire' });

    // 4. Surrounding Spire Cluster 3
    var spire4 = new THREE.Mesh(spire2Geometry, spireMaterial);
    spire4.position.set(5, 9, -9);
    spire4.castShadow = true;
    scene.add(spire4);
    objects.push({ mesh: spire4, type: 'spire' });

    // 5. Resonance Chamber - cylindrical structure with vibrating rods
    var chamberGeometry = new THREE.CylinderGeometry(6, 6, 8, 12);
    var chamberMaterial = new THREE.MeshPhongMaterial({
      color: 0x8800ff,
      shininess: 80,
      transparent: true,
      opacity: 0.7
    });
    var chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
    chamber.position.set(0, 4, 0);
    chamber.castShadow = true;
    scene.add(chamber);
    objects.push({ mesh: chamber, type: 'chamber' });

    // 6. Resonance Rod 1
    var rodGeometry = new THREE.CylinderGeometry(0.3, 0.3, 7, 6);
    var rodMaterial = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      shininess: 120
    });
    var rod1 = new THREE.Mesh(rodGeometry, rodMaterial);
    rod1.position.set(3, 4, 0);
    rod1.castShadow = true;
    scene.add(rod1);
    objects.push({ mesh: rod1, type: 'rod' });

    // 7. Resonance Rod 2
    var rod2 = new THREE.Mesh(rodGeometry, rodMaterial);
    rod2.position.set(-3, 4, 0);
    rod2.castShadow = true;
    scene.add(rod2);
    objects.push({ mesh: rod2, type: 'rod' });

    // 8. Energy Beam Refractor Prism
    var prismGeometry = new THREE.ConeGeometry(2, 5, 3);
    var prismMaterial = new THREE.MeshPhongMaterial({
      color: 0xffff00,
      shininess: 150,
      transparent: true,
      opacity: 0.9
    });
    var prism = new THREE.Mesh(prismGeometry, prismMaterial);
    prism.position.set(10, 8, 0);
    prism.rotation.z = Math.PI / 4;
    prism.castShadow = true;
    scene.add(prism);
    objects.push({ mesh: prism, type: 'prism' });

    // 9. Mineral Garden Formation 1 - cluster of spheres
    var mineralGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    var mineralMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      shininess: 90
    });
    var mineral1 = new THREE.Mesh(mineralGeometry, mineralMaterial);
    mineral1.position.set(-10, 3, -8);
    mineral1.castShadow = true;
    scene.add(mineral1);
    objects.push({ mesh: mineral1, type: 'mineral' });

    // 10. Mineral Garden Formation 2
    var mineral2 = new THREE.Mesh(mineralGeometry, mineralMaterial);
    mineral2.position.set(-8, 2, -6);
    mineral2.castShadow = true;
    scene.add(mineral2);
    objects.push({ mesh: mineral2, type: 'mineral' });

    // 11. Alien Throne Structure - elevated platform
    var throneBaseGeometry = new THREE.BoxGeometry(4, 0.8, 4);
    var throneMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0088,
      shininess: 100
    });
    var throneBase = new THREE.Mesh(throneBaseGeometry, throneMaterial);
    throneBase.position.set(0, 7, 12);
    throneBase.castShadow = true;
    scene.add(throneBase);
    objects.push({ mesh: throneBase, type: 'throne' });

    // 12. Throne Backrest
    var backrestGeometry = new THREE.BoxGeometry(3, 4, 0.6);
    var backrest = new THREE.Mesh(backrestGeometry, throneMaterial);
    backrest.position.set(0, 9.5, 11);
    backrest.castShadow = true;
    scene.add(backrest);
    objects.push({ mesh: backrest, type: 'throne' });

    // 13. Bioluminescent Pool - circular ring
    var poolGeometry = new THREE.CylinderGeometry(5, 5, 0.3, 32);
    var poolMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.6
    });
    var pool = new THREE.Mesh(poolGeometry, poolMaterial);
    pool.position.set(-12, 0.2, 8);
    pool.receiveShadow = true;
    scene.add(pool);
    objects.push({ mesh: pool, type: 'pool' });

    // 14. Anti-Gravity Platform Ring 1
    var platformGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 16);
    var platformMaterial = new THREE.MeshPhongMaterial({
      color: 0xffaa00,
      emissive: 0xff6600,
      emissiveIntensity: 0.7,
      shininess: 100
    });
    var platform1 = new THREE.Mesh(platformGeometry, platformMaterial);
    platform1.position.set(0, 15, 0);
    platform1.rotation.z = Math.PI / 4;
    platform1.castShadow = true;
    scene.add(platform1);
    objects.push({ mesh: platform1, type: 'platform', radius: 8 });

    // 15. Anti-Gravity Platform Ring 2
    var platform2 = new THREE.Mesh(platformGeometry, platformMaterial);
    platform2.position.set(0, 18, 0);
    platform2.rotation.x = Math.PI / 3;
    platform2.castShadow = true;
    scene.add(platform2);
    objects.push({ mesh: platform2, type: 'platform', radius: 8 });

    // 16. Crystal Bridge Span
    var bridgeGeometry = new THREE.BoxGeometry(2, 0.4, 10);
    var bridgeMaterial = new THREE.MeshPhongMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.8
    });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(15, 6, 0);
    bridge.castShadow = true;
    scene.add(bridge);
    objects.push({ mesh: bridge, type: 'bridge' });

    // 17. Sound Weapon Emitter 1 - cone-shaped emitter
    var emitterGeometry = new THREE.ConeGeometry(1, 3, 8);
    var emitterMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff5500,
      emissiveIntensity: 0.8
    });
    var emitter1 = new THREE.Mesh(emitterGeometry, emitterMaterial);
    emitter1.position.set(-15, 10, -5);
    emitter1.rotation.x = Math.PI / 2;
    emitter1.castShadow = true;
    scene.add(emitter1);
    objects.push({ mesh: emitter1, type: 'emitter' });

    // 18. Sound Weapon Emitter 2
    var emitter2 = new THREE.Mesh(emitterGeometry, emitterMaterial);
    emitter2.position.set(-15, 10, 5);
    emitter2.rotation.x = Math.PI / 2;
    emitter2.castShadow = true;
    scene.add(emitter2);
    objects.push({ mesh: emitter2, type: 'emitter' });

    // 19. Crystal Growth Pod 1
    var podGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    var podMaterial = new THREE.MeshPhongMaterial({
      color: 0x88ff00,
      emissive: 0x44ff00,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.75
    });
    var pod1 = new THREE.Mesh(podGeometry, podMaterial);
    pod1.position.set(12, 5, -10);
    pod1.castShadow = true;
    scene.add(pod1);
    objects.push({ mesh: pod1, type: 'pod' });

    // 20. Crystal Growth Pod 2
    var pod2 = new THREE.Mesh(podGeometry, podMaterial);
    pod2.position.set(10, 4, -8);
    pod2.castShadow = true;
    scene.add(pod2);
    objects.push({ mesh: pod2, type: 'pod' });

    return objects.length;
  };

  // Update animation loop
  var update = function() {
    elapsedTime = (Date.now() - startTime) / 1000;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      var mesh = obj.mesh;

      // Spire rotation and pulse
      if (obj.type === 'spire') {
        mesh.rotation.y += 0.005;
        var scale = 1 + 0.1 * Math.sin(elapsedTime * 2);
        mesh.scale.set(scale, scale, scale);
      }

      // Chamber vibration
      if (obj.type === 'chamber') {
        mesh.rotation.y += 0.002;
        mesh.position.y = 4 + 0.3 * Math.sin(elapsedTime * 3);
      }

      // Resonance rods vibration
      if (obj.type === 'rod') {
        mesh.rotation.z = 0.1 * Math.sin(elapsedTime * 4);
        mesh.position.y = 4 + 0.5 * Math.cos(elapsedTime * 3);
      }

      // Prism rotation and refraction color shift
      if (obj.type === 'prism') {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.008;
        var hue = (elapsedTime * 60) % 360;
        mesh.material.color.setHSL(hue / 360, 1, 0.5);
      }

      // Mineral rotation and pulse
      if (obj.type === 'mineral') {
        mesh.rotation.x += 0.003;
        mesh.rotation.z += 0.004;
        var mineralScale = 1 + 0.15 * Math.sin(elapsedTime * 2.5);
        mesh.scale.set(mineralScale, mineralScale, mineralScale);
      }

      // Throne base glow pulse
      if (obj.type === 'throne') {
        mesh.material.emissiveIntensity = 0.3 + 0.2 * Math.sin(elapsedTime * 2);
      }

      // Pool ripple effect via emissive intensity
      if (obj.type === 'pool') {
        mesh.material.emissiveIntensity = 0.5 + 0.3 * Math.sin(elapsedTime * 1.5);
        mesh.rotation.z += 0.002;
      }

      // Anti-gravity platforms orbit
      if (obj.type === 'platform') {
        var orbitSpeed = obj.radius / 10;
        var angle = elapsedTime * orbitSpeed;
        mesh.position.x = Math.cos(angle) * 4;
        mesh.position.z = Math.sin(angle) * 4;
        mesh.rotation.y = angle;
      }

      // Crystal bridge sway
      if (obj.type === 'bridge') {
        mesh.rotation.z = 0.05 * Math.sin(elapsedTime * 1.2);
        mesh.position.y = 6 + 0.3 * Math.cos(elapsedTime * 1.5);
      }

      // Sound weapon emitter pulse
      if (obj.type === 'emitter') {
        mesh.material.emissiveIntensity = 0.5 + 0.5 * Math.sin(elapsedTime * 3);
        var emitterScale = 1 + 0.2 * Math.sin(elapsedTime * 4);
        mesh.scale.set(emitterScale, emitterScale, emitterScale);
      }

      // Crystal pod glow and rotation
      if (obj.type === 'pod') {
        mesh.rotation.y += 0.006;
        mesh.rotation.x += 0.004;
        mesh.material.emissiveIntensity = 0.4 + 0.3 * Math.sin(elapsedTime * 2);
      }
    }
  };

  // Reset function - remove all objects
  var reset = function() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i].mesh);
    }
    objects = [];
    startTime = Date.now();
    elapsedTime = 0;
  };

  // Public API
  return {
    init: init,
    update: update,
    reset: reset
  };
}());
