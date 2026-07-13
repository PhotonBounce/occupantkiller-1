window.TankGraveyard = (function() {
  'use strict';

  var meshes = [];
  var animatedObjects = [];

  function createTankHull(x, y, z, scene, burned) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var hullColor = burned ? 0x1A1A1A : 0x4A7C4E;
    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(8, 3.5, 4),
      new THREE.MeshStandardMaterial({ color: hullColor, metalness: 0.4, roughness: 0.7 })
    );
    hull.position.y = 1.75;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    var turret = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 3),
      new THREE.MeshStandardMaterial({ color: hullColor, metalness: 0.4, roughness: 0.7 })
    );
    turret.position.set(0, 3.5, 0);
    turret.castShadow = true;
    turret.receiveShadow = true;
    group.add(turret);

    var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
    var barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 6, 16),
      barrelMaterial
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(3, 3.5, 0);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    group.add(barrel);

    if (burned) {
      var smokeParticles = [];
      for (var i = 0; i < 3; i++) {
        var smoke = new THREE.Mesh(
          new THREE.SphereGeometry(0.8 + i * 0.3, 8, 8),
          new THREE.MeshStandardMaterial({
            color: 0x444444,
            emissive: 0x222222,
            transparent: true,
            opacity: 0.4 - i * 0.1
          })
        );
        smoke.position.set(0, 4 + i * 1.5, 0);
        smokeParticles.push({ mesh: smoke, baseY: 4 + i * 1.5, speed: 0.3 + i * 0.1 });
        group.add(smoke);
      }
      animatedObjects.push({
        type: 'smoke',
        particles: smokeParticles
      });
    }

    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createAPCWreck(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var hullColor = 0x1A1A1A;
    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 3),
      new THREE.MeshStandardMaterial({ color: hullColor, metalness: 0.3, roughness: 0.8 })
    );
    hull.position.y = 1.5;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    var hatch = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.3, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x8B3A00, metalness: 0.2, roughness: 0.9 })
    );
    hatch.position.set(-1, 3.1, 0);
    hatch.rotation.z = Math.PI / 3;
    hatch.castShadow = true;
    group.add(hatch);

    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createArtilleryPiece(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var trail = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, 3),
      new THREE.MeshStandardMaterial({ color: 0x2A2A2A, metalness: 0.2, roughness: 0.9 })
    );
    trail.position.y = 0.15;
    trail.castShadow = true;
    group.add(trail);

    var barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x1A1A1A, metalness: 0.5, roughness: 0.6 })
    );
    barrel.rotation.z = Math.PI / 2.2;
    barrel.position.set(3, 2, 0);
    barrel.castShadow = true;
    group.add(barrel);

    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createEnemyTechnical(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var truck = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0x3A3A3A, metalness: 0.3, roughness: 0.8 })
    );
    truck.position.y = 1;
    truck.castShadow = true;
    truck.receiveShadow = true;
    group.add(truck);

    var gunMount = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.5, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x2A2A2A, metalness: 0.4, roughness: 0.7 })
    );
    gunMount.position.set(0, 2.5, 0);
    gunMount.castShadow = true;
    group.add(gunMount);

    var gun = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 5, 12),
      new THREE.MeshStandardMaterial({ color: 0x1A1A1A, metalness: 0.6, roughness: 0.5 })
    );
    gun.rotation.z = Math.PI / 2.5;
    gun.position.set(2, 2.8, 0);
    gun.castShadow = true;
    group.add(gun);

    animatedObjects.push({
      type: 'technical',
      group: group,
      gunRotation: 0,
      scanSpeed: 0.02
    });

    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createShellCrater(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var crater = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.8, 4),
      new THREE.MeshStandardMaterial({ color: 0x3D3D2A, metalness: 0, roughness: 1 })
    );
    crater.position.y = -0.4;
    crater.receiveShadow = true;
    group.add(crater);

    var rim1 = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.2, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x2A2A1A, metalness: 0, roughness: 1 })
    );
    rim1.position.set(0, 0.1, 2);
    group.add(rim1);

    var rim2 = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.2, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x2A2A1A, metalness: 0, roughness: 1 })
    );
    rim2.position.set(0, 0.1, -2);
    group.add(rim2);

    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createBurnedFuelDrum(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x1A1A1A, emissive: 0x3A2010, metalness: 0.1, roughness: 0.9 })
    );
    drum.position.y = 0.6;
    drum.castShadow = true;
    drum.receiveShadow = true;
    group.add(drum);

    var drumTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12),
      new THREE.MeshStandardMaterial({ color: 0x0A0A0A, metalness: 0.2, roughness: 0.8 })
    );
    drumTop.position.y = 1.25;
    group.add(drumTop);

    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createAmmoBox(x, y, z, scene) {
    var box = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.5, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x4A4A3A, metalness: 0.1, roughness: 0.9 })
    );
    box.position.set(x, y, z);
    box.castShadow = true;
    box.receiveShadow = true;
    scene.add(box);
    meshes.push(box);
    return box;
  }

  function createBrokenTrack(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    for (var i = 0; i < 4; i++) {
      var segment = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.2, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x1A1A1A, metalness: 0.2, roughness: 0.8 })
      );
      segment.position.set(i * 1 - 1.5, 0.1, 0);
      segment.rotation.z = Math.random() * 0.3;
      group.add(segment);
    }

    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createSniperNest(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    for (var i = 0; i < 8; i++) {
      var sandbag = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.4, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x6B5D4F, metalness: 0, roughness: 1 })
      );
      var angle = (i / 8) * Math.PI * 2;
      sandbag.position.set(Math.cos(angle) * 1.5, 0.2, Math.sin(angle) * 1.5);
      group.add(sandbag);
    }

    animatedObjects.push({
      type: 'sniper',
      group: group,
      glintIntensity: 0,
      glintSpeed: 0.15
    });

    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createBattleFlag(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x2A2A2A, metalness: 0.3, roughness: 0.7 })
    );
    pole.position.y = 3;
    pole.castShadow = true;
    group.add(pole);

    var flag = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x8B0000, metalness: 0, roughness: 0.8 })
    );
    flag.position.set(1.2, 5, 0);
    flag.castShadow = true;
    group.add(flag);

    animatedObjects.push({
      type: 'flag',
      flag: flag,
      baseRotation: 0,
      flagWave: 0
    });

    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createFuelFire(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var fireParticles = [];
    for (var i = 0; i < 4; i++) {
      var flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.4 + i * 0.2, 6, 6),
        new THREE.MeshStandardMaterial({
          color: 0xFF6600,
          emissive: 0xFF3300,
          transparent: true,
          opacity: 0.6 - i * 0.12
        })
      );
      flame.position.y = i * 0.8;
      fireParticles.push({ mesh: flame, baseY: i * 0.8, flicker: Math.random() });
      group.add(flame);
    }

    animatedObjects.push({
      type: 'fire',
      particles: fireParticles,
      time: 0
    });

    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createSandDune(x, y, z, scale, scene) {
    var dune = new THREE.Mesh(
      new THREE.BoxGeometry(scale * 3, scale * 1.5, scale * 2),
      new THREE.MeshStandardMaterial({ color: 0xC2B280, metalness: 0, roughness: 1 })
    );
    dune.position.set(x, y, z);
    dune.castShadow = true;
    dune.receiveShadow = true;
    scene.add(dune);
    meshes.push(dune);
    return dune;
  }

  function createDesertFloor(x, y, z, w, d, scene) {
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.5, d),
      new THREE.MeshStandardMaterial({ color: 0xD2B48C, metalness: 0, roughness: 1 })
    );
    floor.position.set(x, y, z);
    floor.receiveShadow = true;
    scene.add(floor);
    meshes.push(floor);
    return floor;
  }

  function createScatteredEquipment(x, y, z, scene) {
    var item = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x5A5A4A, metalness: 0.2, roughness: 0.8 })
    );
    item.position.set(x, y, z);
    item.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
    item.castShadow = true;
    item.receiveShadow = true;
    scene.add(item);
    meshes.push(item);
    return item;
  }

  function createHeatShimmer(x, y, z, scene) {
    var shimmer = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.1, 3),
      new THREE.MeshStandardMaterial({
        color: 0xD2B48C,
        emissive: 0x8B7355,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 0.3
      })
    );
    shimmer.position.set(x, y, z);
    shimmer.receiveShadow = true;

    animatedObjects.push({
      type: 'shimmer',
      mesh: shimmer,
      pulse: 0,
      speed: 2
    });

    scene.add(shimmer);
    meshes.push(shimmer);
    return shimmer;
  }

  function init(scene, camera) {
    meshes = [];
    animatedObjects = [];

    createDesertFloor(0, 0, 0, 150, 150, scene);
    createDesertFloor(0, -10, 0, 150, 150, scene);

    createSandDune(20, 0.5, 15, 8, scene);
    createSandDune(-25, 0.8, -20, 6, scene);
    createSandDune(30, 0.3, -35, 5, scene);

    createTankHull(-30, 0, -25, scene, true);
    createTankHull(15, 0, 10, scene, false);
    createTankHull(-10, 0, 35, scene, true);
    createTankHull(40, 0, -15, scene, false);

    createAPCWreck(-50, 0, 0, scene);
    createAPCWreck(25, 0, -40, scene);

    createArtilleryPiece(-20, 0, 20, scene);
    createArtilleryPiece(45, 0, 30, scene);

    createEnemyTechnical(-5, 0, -20, scene);

    createShellCrater(10, 0, -30, scene);
    createShellCrater(-35, 0, 15, scene);
    createShellCrater(50, 0, 20, scene);

    createBurnedFuelDrum(-15, 0, -10, scene);
    createBurnedFuelDrum(35, 0, 5, scene);
    createBurnedFuelDrum(-40, 0, 25, scene);
    createBurnedFuelDrum(20, 0, 40, scene);

    createAmmoBox(-8, 0.25, 5, scene);
    createAmmoBox(12, 0.25, -15, scene);
    createAmmoBox(-45, 0.25, -5, scene);
    createAmmoBox(55, 0.25, -25, scene);

    createBrokenTrack(-20, 0, 10, scene);
    createBrokenTrack(5, 0, 25, scene);

    createSniperNest(-10, 0, 8, scene);
    createSniperNest(30, 0, -10, scene);

    createBattleFlag(0, 0, 0, scene);

    createFuelFire(-15, 0, -10, scene);
    createFuelFire(35, 0, 5, scene);

    createScatteredEquipment(-3, 0.15, -5, scene);
    createScatteredEquipment(18, 0.15, 22, scene);
    createScatteredEquipment(-42, 0.15, 8, scene);
    createScatteredEquipment(52, 0.15, -8, scene);

    createHeatShimmer(0, 0.05, 10, scene);
    createHeatShimmer(-20, 0.05, -15, scene);
    createHeatShimmer(40, 0.05, 25, scene);
  }

  function update(delta) {
    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];

      if (obj.type === 'smoke' && obj.particles) {
        for (var j = 0; j < obj.particles.length; j++) {
          var particle = obj.particles[j];
          particle.mesh.position.y += particle.speed * delta;
          particle.mesh.position.x += Math.sin(Date.now() * 0.001 + j) * 0.3 * delta;
          particle.mesh.position.z += Math.cos(Date.now() * 0.0008 + j) * 0.2 * delta;
        }
      }

      if (obj.type === 'technical') {
        obj.gunRotation += obj.scanSpeed;
        if (obj.gunRotation > Math.PI / 3) obj.scanSpeed = -obj.scanSpeed;
        if (obj.gunRotation < -Math.PI / 3) obj.scanSpeed = -obj.scanSpeed;
        obj.group.rotation.y += obj.scanSpeed * 0.3;
      }

      if (obj.type === 'flag') {
        obj.flagWave += delta * 3;
        obj.flag.rotation.z = Math.sin(obj.flagWave) * 0.3;
        obj.flag.position.x = 1.2 + Math.cos(obj.flagWave * 1.5) * 0.15;
      }

      if (obj.type === 'sniper') {
        obj.glintIntensity += (Math.sin(Date.now() * 0.002) > 0 ? obj.glintSpeed : -obj.glintSpeed);
        obj.glintIntensity = Math.max(0, Math.min(1, obj.glintIntensity));
        if (obj.glintIntensity > 0.8 || obj.glintIntensity < 0.2) {
          obj.glintSpeed *= -1;
        }
      }

      if (obj.type === 'fire' && obj.particles) {
        obj.time += delta;
        for (var k = 0; k < obj.particles.length; k++) {
          var flame = obj.particles[k];
          var flicker = Math.sin(obj.time * 5 + flame.flicker * Math.PI) * 0.3 + 0.7;
          flame.mesh.scale.set(flicker, flicker, flicker);
        }
      }

      if (obj.type === 'shimmer') {
        obj.pulse += delta * obj.speed;
        var shimmerOpacity = Math.sin(obj.pulse) * 0.15 + 0.3;
        obj.mesh.material.opacity = shimmerOpacity;
        obj.mesh.material.emissiveIntensity = Math.sin(obj.pulse * 2) * 0.5 + 0.3;
      }
    }
  }

  function reset() {
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].geometry) meshes[i].geometry.dispose();
      if (meshes[i].material) {
        if (Array.isArray(meshes[i].material)) {
          for (var j = 0; j < meshes[i].material.length; j++) {
            meshes[i].material[j].dispose();
          }
        } else {
          meshes[i].material.dispose();
        }
      }
    }
    meshes = [];
    animatedObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
