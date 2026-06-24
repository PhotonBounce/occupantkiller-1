window.IceCavern = (function() {
  'use strict';

  var objects = [];
  var animatedObjects = [];

  var init = function(scene, camera) {
    // Clear any existing objects
    objects = [];
    animatedObjects = [];

    // 1. Ice Stalagmites - tall cone formations from floor
    var stalagmitePositions = [
      { x: -30, z: -50, height: 15, scale: 1.2 },
      { x: 25, z: -45, height: 18, scale: 1.4 },
      { x: -15, z: -60, height: 12, scale: 0.9 },
      { x: 40, z: -55, height: 16, scale: 1.1 },
      { x: -45, z: -40, height: 14, scale: 1.0 }
    ];

    stalagmitePositions.forEach(function(pos) {
      var geometry = new THREE.ConeGeometry(2 * pos.scale, pos.height, 8);
      var material = new THREE.MeshPhongMaterial({ color: 0xAADDFF, shininess: 100 });
      var stalagmite = new THREE.Mesh(geometry, material);
      stalagmite.position.set(pos.x, pos.height / 2, pos.z);
      scene.add(stalagmite);
      objects.push(stalagmite);
    });

    // 2. Ice Stalactites - inverted cones hanging from ceiling
    var stalactitePositions = [
      { x: -25, z: -55, height: 12, scale: 1.0 },
      { x: 30, z: -50, height: 14, scale: 1.2 },
      { x: -10, z: -40, height: 10, scale: 0.8 },
      { x: 45, z: -60, height: 13, scale: 1.1 }
    ];

    stalactitePositions.forEach(function(pos) {
      var geometry = new THREE.ConeGeometry(1.8 * pos.scale, pos.height, 8);
      var material = new THREE.MeshPhongMaterial({ color: 0x88CCEE, shininess: 100 });
      var stalactite = new THREE.Mesh(geometry, material);
      stalactite.rotation.z = Math.PI;
      stalactite.position.set(pos.x, 100 - pos.height / 2, pos.z);
      scene.add(stalactite);
      objects.push(stalactite);
      animatedObjects.push({ mesh: stalactite, type: 'stalactite', baseY: 100 - pos.height / 2 });
    });

    // 3. Frozen underground lake - wide flat platform
    var lakeGeometry = new THREE.BoxGeometry(80, 2, 60);
    var lakeMaterial = new THREE.MeshPhongMaterial({
      color: 0x99BBDD,
      emissive: 0x4488AA,
      emissiveIntensity: 0.3,
      shininess: 120
    });
    var lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
    lake.position.set(0, -1, -50);
    scene.add(lake);
    objects.push(lake);
    animatedObjects.push({ mesh: lake, type: 'lake', baseIntensity: 0.3 });

    // 4. Crystal ice formations - sphere clusters
    var crystalPositions = [
      { x: -35, y: 8, z: -35, radius: 2.0 },
      { x: 20, y: 5, z: -70, radius: 1.5 },
      { x: 0, y: 10, z: -25, radius: 2.2 },
      { x: 35, y: 6, z: -45, radius: 1.8 },
      { x: -50, y: 7, z: -60, radius: 1.6 }
    ];

    crystalPositions.forEach(function(pos) {
      var geometry = new THREE.SphereGeometry(pos.radius, 16, 16);
      var material = new THREE.MeshPhongMaterial({
        color: 0xCCEEFF,
        shininess: 150,
        transparent: true,
        opacity: 0.85
      });
      var crystal = new THREE.Mesh(geometry, material);
      crystal.position.set(pos.x, pos.y, pos.z);
      scene.add(crystal);
      objects.push(crystal);
      animatedObjects.push({ mesh: crystal, type: 'crystal' });
    });

    // 5. Ancient frozen soldiers - box figures ice-encased
    var soldierPositions = [
      { x: -20, z: -30 },
      { x: 15, z: -65 },
      { x: -40, z: -50 }
    ];

    soldierPositions.forEach(function(pos) {
      var bodyGeometry = new THREE.BoxGeometry(2, 5, 1.5);
      var soldierMaterial = new THREE.MeshPhongMaterial({ color: 0x7799AA, shininess: 80 });
      var soldier = new THREE.Mesh(bodyGeometry, soldierMaterial);
      soldier.position.set(pos.x, 2.5, pos.z);
      scene.add(soldier);
      objects.push(soldier);
    });

    // 6. Hidden enemy base - box structures
    var baseGeometry = new THREE.BoxGeometry(15, 12, 10);
    var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x445566, shininess: 60 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(-50, 6, 20);
    scene.add(base);
    objects.push(base);

    // Add smaller base structure
    var baseSmallGeometry = new THREE.BoxGeometry(8, 8, 6);
    var baseSmall = new THREE.Mesh(baseSmallGeometry, baseMaterial);
    baseSmall.position.set(-45, 4, 35);
    scene.add(baseSmall);
    objects.push(baseSmall);

    // 7. Thermal drill machine - rotating cylinder with drill bit
    var drillBodyGeometry = new THREE.CylinderGeometry(3, 3, 8, 16);
    var drillMaterial = new THREE.MeshPhongMaterial({ color: 0x886633, shininess: 80 });
    var drillBody = new THREE.Mesh(drillBodyGeometry, drillMaterial);
    drillBody.position.set(50, 4, -30);
    scene.add(drillBody);
    objects.push(drillBody);
    animatedObjects.push({ mesh: drillBody, type: 'drill' });

    // Drill bit
    var drillBitGeometry = new THREE.ConeGeometry(2.5, 6, 8);
    var drillBitMaterial = new THREE.MeshPhongMaterial({ color: 0x664422, shininess: 70 });
    var drillBit = new THREE.Mesh(drillBitGeometry, drillBitMaterial);
    drillBit.position.set(50, -2, -30);
    scene.add(drillBit);
    objects.push(drillBit);
    animatedObjects.push({ mesh: drillBit, type: 'drillBit' });

    // 8. Supply crates frozen in ice - boxes
    var cratePositions = [
      { x: -30, y: 3, z: 0 },
      { x: 25, y: 2, z: 10 },
      { x: 0, y: 3.5, z: -15 }
    ];

    cratePositions.forEach(function(pos) {
      var crateGeometry = new THREE.BoxGeometry(4, 3, 3);
      var crateMaterial = new THREE.MeshPhongMaterial({ color: 0x997766, shininess: 40 });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(pos.x, pos.y, pos.z);
      scene.add(crate);
      objects.push(crate);
    });

    // 9. Ice bridge crossing - box slabs spanning gap
    var bridgeSegments = [
      { x: 10, z: 30 },
      { x: 15, z: 40 },
      { x: 12, z: 50 }
    ];

    bridgeSegments.forEach(function(pos) {
      var bridgeGeometry = new THREE.BoxGeometry(8, 1.5, 8);
      var bridgeMaterial = new THREE.MeshPhongMaterial({ color: 0xAABBCC, shininess: 100 });
      var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
      bridge.position.set(pos.x, 5, pos.z);
      scene.add(bridge);
      objects.push(bridge);
    });

    // 10. Glowing mineral deposits - sphere emissive
    var mineralPositions = [
      { x: -55, y: 15, z: -40 },
      { x: 45, y: 18, z: -55 },
      { x: -25, y: 12, z: 15 },
      { x: 35, y: 14, z: 25 },
      { x: 0, y: 20, z: -70 }
    ];

    mineralPositions.forEach(function(pos) {
      var mineralGeometry = new THREE.SphereGeometry(1.5, 12, 12);
      var mineralMaterial = new THREE.MeshPhongMaterial({
        color: 0x00AAFF,
        emissive: 0x0077FF,
        emissiveIntensity: 0.6,
        shininess: 120
      });
      var mineral = new THREE.Mesh(mineralGeometry, mineralMaterial);
      mineral.position.set(pos.x, pos.y, pos.z);
      scene.add(mineral);
      objects.push(mineral);
      animatedObjects.push({ mesh: mineral, type: 'mineral', baseIntensity: 0.6 });
    });

    // 11. Ventilation shafts blowing steam - cylinders with scale effect
    var ventPositions = [
      { x: -60, z: -30 },
      { x: 60, z: -40 }
    ];

    ventPositions.forEach(function(pos) {
      var ventGeometry = new THREE.CylinderGeometry(2.5, 2.5, 6, 8);
      var ventMaterial = new THREE.MeshPhongMaterial({ color: 0x666677, shininess: 50 });
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(pos.x, 3, pos.z);
      scene.add(vent);
      objects.push(vent);
      animatedObjects.push({ mesh: vent, type: 'vent', baseScaleY: 1.0 });
    });

    // 12. Underwater tunnel entrance - box frame
    var tunnelGeometry = new THREE.BoxGeometry(8, 10, 3);
    var tunnelMaterial = new THREE.MeshPhongMaterial({ color: 0x334455, shininess: 70 });
    var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel.position.set(0, 5, -80);
    scene.add(tunnel);
    objects.push(tunnel);

    // 13. Warning icicle fall zones - hanging cones
    var icicleFallZones = [
      { x: -35, z: -25 },
      { x: 40, z: -35 }
    ];

    icicleFallZones.forEach(function(pos) {
      var icicleGeometry = new THREE.ConeGeometry(1.2, 8, 6);
      var icicleMaterial = new THREE.MeshPhongMaterial({ color: 0xDDEEFF, shininess: 110 });
      var icicle = new THREE.Mesh(icicleGeometry, icicleMaterial);
      icicle.rotation.z = Math.PI;
      icicle.position.set(pos.x, 95, pos.z);
      scene.add(icicle);
      objects.push(icicle);
    });

    // 14. Emergency heating units - orange glow boxes
    var heatingPositions = [
      { x: -35, z: 40 },
      { x: 40, z: 35 }
    ];

    heatingPositions.forEach(function(pos) {
      var heatingGeometry = new THREE.BoxGeometry(3, 4, 3);
      var heatingMaterial = new THREE.MeshPhongMaterial({
        color: 0xAA4422,
        emissive: 0xFF6633,
        emissiveIntensity: 0.5,
        shininess: 80
      });
      var heating = new THREE.Mesh(heatingGeometry, heatingMaterial);
      heating.position.set(pos.x, 2, pos.z);
      scene.add(heating);
      objects.push(heating);
      animatedObjects.push({ mesh: heating, type: 'heating', baseIntensity: 0.5 });
    });

    // 15. Additional ice crystal shimmer sphere for 16th object
    var extraCrystalGeometry = new THREE.SphereGeometry(1.8, 14, 14);
    var extraCrystalMaterial = new THREE.MeshPhongMaterial({
      color: 0xCCEEFF,
      shininess: 140,
      transparent: true,
      opacity: 0.8
    });
    var extraCrystal = new THREE.Mesh(extraCrystalGeometry, extraCrystalMaterial);
    extraCrystal.position.set(20, 11, -20);
    scene.add(extraCrystal);
    objects.push(extraCrystal);
    animatedObjects.push({ mesh: extraCrystal, type: 'crystal' });
  };

  var update = function(delta) {
    var time = Date.now() * 0.001;

    animatedObjects.forEach(function(obj) {
      if (obj.type === 'lake') {
        // Frozen lake shimmer
        var shimmer = Math.sin(time * 1.5) * 0.2 + 0.3;
        obj.mesh.material.emissiveIntensity = obj.baseIntensity + shimmer * 0.15;
      }
      else if (obj.type === 'mineral') {
        // Mineral deposits pulse
        var pulse = Math.sin(time * 2) * 0.3 + 0.6;
        obj.mesh.material.emissiveIntensity = pulse;
      }
      else if (obj.type === 'drill') {
        // Thermal drill rotates
        obj.mesh.rotation.y += delta * 3;
      }
      else if (obj.type === 'drillBit') {
        // Drill bit rotates faster
        obj.mesh.rotation.z += delta * 5;
      }
      else if (obj.type === 'vent') {
        // Ventilation shaft steam effect (scale pulse)
        var steam = Math.sin(time * 2.5) * 0.2 + 1.0;
        obj.mesh.scale.y = obj.baseScaleY * steam;
      }
      else if (obj.type === 'heating') {
        // Heating units glow brighter/dimmer
        var glow = Math.sin(time * 1.8) * 0.4 + 0.5;
        obj.mesh.material.emissiveIntensity = glow;
      }
      else if (obj.type === 'crystal') {
        // Ice crystals shimmer subtly
        obj.mesh.rotation.x += delta * 0.3;
        obj.mesh.rotation.y += delta * 0.4;
      }
      else if (obj.type === 'stalactite') {
        // Stalactites drip (position oscillates slightly)
        var drip = Math.sin(time * 3) * 0.15;
        obj.mesh.position.y = obj.baseY + drip;
      }
    });
  };

  var reset = function() {
    objects.forEach(function(obj) {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    });
    objects = [];
    animatedObjects = [];
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
