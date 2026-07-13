var ShantyTown = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animationState = {
    laundrySwayTime: 0,
    tireFireTime: 0,
    waterDripTime: 0,
    propagandaFlashTime: 0
  };

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];

    // Corrugated tin shack cluster - main structures
    var shackMaterial = new THREE.MeshPhongMaterial({ color: 0x8B7355, emissive: 0x2d2d2d });
    var roofMaterial = new THREE.MeshPhongMaterial({ color: 0x696969, emissive: 0x1a1a1a });
    var metalMaterial = new THREE.MeshPhongMaterial({ color: 0x555555, emissive: 0x1a1a1a });

    // Shack 1 - main structure
    var shack1Wall = new THREE.Mesh(
      new THREE.BoxGeometry(6, 4, 5),
      shackMaterial
    );
    shack1Wall.position.set(-8, 2, 0);
    scene.add(shack1Wall);
    objects.push(shack1Wall);

    var shack1Roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.5, 2, 4),
      roofMaterial
    );
    shack1Roof.position.set(-8, 6, 0);
    scene.add(shack1Roof);
    objects.push(shack1Roof);

    // Shack 2 - adjacent structure
    var shack2Wall = new THREE.Mesh(
      new THREE.BoxGeometry(5, 3.5, 4),
      shackMaterial
    );
    shack2Wall.position.set(-2, 1.75, 1);
    scene.add(shack2Wall);
    objects.push(shack2Wall);

    var shack2Roof = new THREE.Mesh(
      new THREE.ConeGeometry(3, 1.8, 4),
      roofMaterial
    );
    shack2Roof.position.set(-2, 5.3, 1);
    scene.add(shack2Roof);
    objects.push(shack2Roof);

    // Shack 3 - smaller structure
    var shack3Wall = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 3),
      shackMaterial
    );
    shack3Wall.position.set(4, 1.5, -2);
    scene.add(shack3Wall);
    objects.push(shack3Wall);

    var shack3Roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 1.5, 4),
      roofMaterial
    );
    shack3Roof.position.set(4, 4.5, -2);
    scene.add(shack3Roof);
    objects.push(shack3Roof);

    // Improvised watchtower from scrap
    var towerBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 6, 1.5),
      metalMaterial
    );
    towerBase.position.set(10, 3, 5);
    scene.add(towerBase);
    objects.push(towerBase);

    var towerPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.5, 3),
      metalMaterial
    );
    towerPlatform.position.set(10, 6.25, 5);
    scene.add(towerPlatform);
    objects.push(towerPlatform);

    var towerRail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 3, 8),
      metalMaterial
    );
    towerRail.position.set(10, 7.75, 5);
    scene.add(towerRail);
    objects.push(towerRail);

    // Street market stalls
    var stallMaterial = new THREE.MeshPhongMaterial({ color: 0xCD853F, emissive: 0x4d3319 });
    var stall1 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 2),
      stallMaterial
    );
    stall1.position.set(-6, 1.25, -8);
    scene.add(stall1);
    objects.push(stall1);

    var stall1Top = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.3, 2.5),
      roofMaterial
    );
    stall1Top.position.set(-6, 3.65, -8);
    scene.add(stall1Top);
    objects.push(stall1Top);

    var stall2 = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 2.5, 2),
      stallMaterial
    );
    stall2.position.set(-1, 1.25, -8);
    scene.add(stall2);
    objects.push(stall2);

    var stall2Top = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.3, 2.5),
      roofMaterial
    );
    stall2Top.position.set(-1, 3.65, -8);
    scene.add(stall2Top);
    objects.push(stall2Top);

    // Stolen military crates stacked as barricades
    var crateMaterial = new THREE.MeshPhongMaterial({ color: 0x2F4F4F, emissive: 0x0a0a0a });
    var crate1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      crateMaterial
    );
    crate1.position.set(8, 0.75, -5);
    scene.add(crate1);
    objects.push(crate1);

    var crate2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      crateMaterial
    );
    crate2.position.set(9.5, 0.75, -5);
    scene.add(crate2);
    objects.push(crate2);

    var crate3 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      crateMaterial
    );
    crate3.position.set(8.75, 2.25, -5);
    scene.add(crate3);
    objects.push(crate3);

    // Laundry lines between rooftops
    var clothesMaterial = new THREE.MeshPhongMaterial({ color: 0xDCDCDC, emissive: 0x333333 });
    var clothesLine1 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.3, 0.3),
      clothesMaterial
    );
    clothesLine1.position.set(-5, 6.5, 2);
    scene.add(clothesLine1);
    objects.push({ mesh: clothesLine1, type: 'laundry', originalPos: { x: -5, y: 6.5, z: 2 } });

    var clothes1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.1),
      clothesMaterial
    );
    clothes1.position.set(-8, 5.5, 2);
    scene.add(clothes1);
    objects.push({ mesh: clothes1, type: 'laundry', originalPos: { x: -8, y: 5.5, z: 2 } });

    var clothes2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.1),
      clothesMaterial
    );
    clothes2.position.set(-2, 5.5, 2);
    scene.add(clothes2);
    objects.push({ mesh: clothes2, type: 'laundry', originalPos: { x: -2, y: 5.5, z: 2 } });

    // Burning tire barricade
    var tireMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, emissive: 0x4d0000 });
    var tire1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16),
      tireMaterial
    );
    tire1.position.set(-10, 0.15, 8);
    scene.add(tire1);
    objects.push({ mesh: tire1, type: 'tire_fire', originalEmissive: 0x4d0000 });

    var tire2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16),
      tireMaterial
    );
    tire2.position.set(-9, 0.15, 8);
    scene.add(tire2);
    objects.push({ mesh: tire2, type: 'tire_fire', originalEmissive: 0x4d0000 });

    var tire3 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16),
      tireMaterial
    );
    tire3.position.set(-8, 0.15, 8);
    scene.add(tire3);
    objects.push({ mesh: tire3, type: 'tire_fire', originalEmissive: 0x4d0000 });

    // Water cistern on rooftop
    var cisternMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a, emissive: 0x1a1a1a });
    var cistern = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 2.5, 12),
      cisternMaterial
    );
    cistern.position.set(-8, 7.5, 0);
    scene.add(cistern);
    objects.push({ mesh: cistern, type: 'water_tank', originalPos: { x: -8, y: 7.5, z: 0 } });

    var cisternTop = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 12, 8),
      cisternMaterial
    );
    cisternTop.scale.set(1, 0.4, 1);
    cisternTop.position.set(-8, 8.8, 0);
    scene.add(cisternTop);
    objects.push(cisternTop);

    // Car bomb shell - destroyed vehicle
    var carMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000, emissive: 0x330000 });
    var carBody = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 5),
      carMaterial
    );
    carBody.position.set(6, 0.75, 8);
    scene.add(carBody);
    objects.push(carBody);

    var carRoof = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1, 3),
      carMaterial
    );
    carRoof.position.set(6, 2, 8);
    carRoof.rotation.z = 0.3;
    scene.add(carRoof);
    objects.push(carRoof);

    // Makeshift clinic
    var clinicMaterial = new THREE.MeshPhongMaterial({ color: 0xF5F5DC, emissive: 0x666666 });
    var clinicWall = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 3),
      clinicMaterial
    );
    clinicWall.position.set(-14, 1.5, -5);
    scene.add(clinicWall);
    objects.push(clinicWall);

    var clinicRoof = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 1.5, 4),
      roofMaterial
    );
    clinicRoof.position.set(-14, 4.5, -5);
    scene.add(clinicRoof);
    objects.push(clinicRoof);

    // Propaganda mural wall with flashing lights
    var muralMaterial = new THREE.MeshPhongMaterial({ color: 0xFF4500, emissive: 0xFF4500 });
    var muralWall = new THREE.Mesh(
      new THREE.BoxGeometry(6, 5, 0.5),
      muralMaterial
    );
    muralWall.position.set(12, 2.5, -10);
    scene.add(muralWall);
    objects.push({ mesh: muralWall, type: 'propaganda', originalEmissive: 0xFF4500 });

    // Additional details: ammo crate near watchtower
    var ammoCrate = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      crateMaterial
    );
    ammoCrate.position.set(11.5, 0.6, 5);
    scene.add(ammoCrate);
    objects.push(ammoCrate);

    // Propane tanks for market
    var tankMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000, emissive: 0x4d0000 });
    var tank1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8),
      tankMaterial
    );
    tank1.position.set(-5, 0.6, -7);
    scene.add(tank1);
    objects.push(tank1);

    var tank2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8),
      tankMaterial
    );
    tank2.position.set(-4, 0.6, -7);
    scene.add(tank2);
    objects.push(tank2);

    // Barbed wire fence line
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      -15, 3, -10,
      15, 3, -10,
      15, 3, 10,
      -15, 3, 10,
      -15, 3, -10
    ]);
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
    var wireLines = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wireLines);
    objects.push(wireLines);
  }

  function update(delta) {
    animationState.laundrySwayTime += delta;
    animationState.tireFireTime += delta;
    animationState.waterDripTime += delta;
    animationState.propagandaFlashTime += delta;

    var laundrySwayAmount = Math.sin(animationState.laundrySwayTime * 2) * 0.15;
    var tireFireBrightness = Math.sin(animationState.tireFireTime * 5) * 0.4 + 0.6;
    var waterDripOffset = Math.sin(animationState.waterDripTime * 3) * 0.08;
    var propagandaFlash = Math.abs(Math.sin(animationState.propagandaFlashTime * 3)) * 0.7 + 0.3;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];

      if (typeof obj === 'object' && obj.type === 'laundry') {
        obj.mesh.position.x = obj.originalPos.x + laundrySwayAmount;
        obj.mesh.rotation.z = laundrySwayAmount * 0.2;
      }

      if (typeof obj === 'object' && obj.type === 'tire_fire') {
        var fireColor = Math.floor(0xFF0000 * tireFireBrightness);
        obj.mesh.material.emissive.setHex(fireColor);
        obj.mesh.scale.y = 1 + (tireFireBrightness - 0.6) * 0.3;
      }

      if (typeof obj === 'object' && obj.type === 'water_tank') {
        obj.mesh.position.y = obj.originalPos.y + waterDripOffset;
      }

      if (typeof obj === 'object' && obj.type === 'propaganda') {
        var propagandaColor = Math.floor(0xFF4500 * propagandaFlash);
        obj.mesh.material.emissive.setHex(propagandaColor);
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj && obj.mesh) {
        scene.remove(obj.mesh);
      } else if (obj) {
        scene.remove(obj);
      }
    }
    objects = [];
    animationState = {
      laundrySwayTime: 0,
      tireFireTime: 0,
      waterDripTime: 0,
      propagandaFlashTime: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
