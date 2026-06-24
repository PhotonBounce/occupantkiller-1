window.SalvageYard = (function() {
  'use strict';

  var sceneObjects = [];

  function init(scene, camera) {
    // Clear any existing objects
    reset();

    // Tank hull towers - stacked crushed tanks
    var tankTower1 = createTankTower(scene, -50, 0, -80);
    var tankTower2 = createTankTower(scene, 30, 0, -60);
    var tankTower3 = createTankTower(scene, -20, 0, 20);

    // Magnetic crane structure
    var craneStructure = createCraneStructure(scene, 0, 15, 0);

    // Crane magnet (animated)
    var craneMagnet = createCraneMagnet(scene, 0, 8, 0);
    sceneObjects.push(craneMagnet);

    // Stripped APC frames
    var apcFrame1 = createAPCFrame(scene, -70, 2, 50);
    var apcFrame2 = createAPCFrame(scene, 60, 2, -30);

    // Weapon stripping stations
    var station1 = createStrippingStation(scene, -40, 1, 40);
    var station2 = createStrippingStation(scene, 40, 1, 30);

    // Scavenger faction camp
    var campFire1 = createCampfire(scene, -35, 0, -40);
    sceneObjects.push(campFire1);
    var campFire2 = createCampfire(scene, -30, 0, -35);
    sceneObjects.push(campFire2);

    // Guard dog kennels
    var kennel1 = createKennel(scene, 50, 1, 50);
    sceneObjects.push(kennel1);
    var kennel2 = createKennel(scene, 55, 1, 55);
    sceneObjects.push(kennel2);

    // Corrugated metal watchtowers
    var tower1 = createWatchtower(scene, -80, 0, 70);
    var tower2 = createWatchtower(scene, 80, 0, 80);

    // Barbed wire perimeter
    var wirePerimeter = createBarbedWirePerimeter(scene);

    // Oil drum barricades
    var barricade1 = createBarricade(scene, -60, 1, -50);
    var barricade2 = createBarricade(scene, 70, 1, -70);
    var barricade3 = createBarricade(scene, 0, 1, 80);

    // Helicopter skeleton
    var heliSkeleton = createHelicopterSkeleton(scene, 20, 2, 60);

    // Ground plane
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      metalness: 0.3,
      roughness: 0.8
    });
    var groundGeometry = new THREE.BoxGeometry(300, 1, 300);
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -1;
    scene.add(ground);
    sceneObjects.push(ground);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffff99, 0.8);
    directionalLight.position.set(100, 80, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    var fireLight = new THREE.PointLight(0xff6b2d, 1.5, 100);
    fireLight.position.set(-35, 5, -40);
    scene.add(fireLight);
    sceneObjects.push(fireLight);
  }

  function createTankTower(scene, x, y, z) {
    var tankGroup = new THREE.Group();
    tankGroup.position.set(x, y, z);

    var tankMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.7,
      roughness: 0.6
    });

    for (var i = 0; i < 3; i++) {
      var tankHull = new THREE.Mesh(
        new THREE.BoxGeometry(30, 15, 20),
        tankMaterial
      );
      tankHull.position.y = i * 16;
      tankHull.rotation.z = Math.random() * 0.3 - 0.15;
      tankHull.castShadow = true;
      tankHull.receiveShadow = true;
      tankGroup.add(tankHull);
    }

    scene.add(tankGroup);
    sceneObjects.push(tankGroup);
    return tankGroup;
  }

  function createCraneStructure(scene, x, y, z) {
    var craneGroup = new THREE.Group();
    craneGroup.position.set(x, y, z);

    var steelMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });

    // Main vertical beam
    var mainBeam = new THREE.Mesh(
      new THREE.BoxGeometry(4, 40, 4),
      steelMaterial
    );
    mainBeam.position.y = 20;
    mainBeam.castShadow = true;
    craneGroup.add(mainBeam);

    // Horizontal boom
    var boom = new THREE.Mesh(
      new THREE.BoxGeometry(80, 3, 3),
      steelMaterial
    );
    boom.position.y = 38;
    boom.position.x = -10;
    boom.castShadow = true;
    craneGroup.add(boom);

    // Counterweight
    var counterweight = new THREE.Mesh(
      new THREE.BoxGeometry(12, 12, 12),
      steelMaterial
    );
    counterweight.position.set(60, 38, 0);
    counterweight.castShadow = true;
    craneGroup.add(counterweight);

    craneGroup.userData.boomMesh = boom;
    scene.add(craneGroup);
    sceneObjects.push(craneGroup);
    return craneGroup;
  }

  function createCraneMagnet(scene, x, y, z) {
    var magnetGroup = new THREE.Group();
    magnetGroup.position.set(x, y, z);
    magnetGroup.userData.type = 'craneMagnet';
    magnetGroup.userData.angle = 0;

    var magnetMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2d2d,
      metalness: 0.9,
      roughness: 0.2
    });

    // Magnet cylinder
    var magnet = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 3, 8),
      magnetMaterial
    );
    magnet.castShadow = true;
    magnetGroup.add(magnet);

    // Coils
    var coilMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b2d,
      emissive: 0xff6b2d,
      emissiveIntensity: 0.5
    });
    var coil = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 1, 16),
      coilMaterial
    );
    coil.position.y = 2;
    magnetGroup.add(coil);

    scene.add(magnetGroup);
    return magnetGroup;
  }

  function createAPCFrame(scene, x, y, z) {
    var apcGroup = new THREE.Group();
    apcGroup.position.set(x, y, z);

    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d3d3d,
      metalness: 0.6,
      roughness: 0.5
    });

    // Main hull frame
    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(25, 12, 15),
      frameMaterial
    );
    hull.castShadow = true;
    hull.receiveShadow = true;
    apcGroup.add(hull);

    // Cabin section
    var cabin = new THREE.Mesh(
      new THREE.BoxGeometry(15, 8, 10),
      frameMaterial
    );
    cabin.position.z = 8;
    cabin.position.y = 2;
    cabin.castShadow = true;
    apcGroup.add(cabin);

    // Missing sections (holes)
    var missingMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.4,
      roughness: 0.9
    });
    var damage = new THREE.Mesh(
      new THREE.SphereGeometry(4, 8, 8),
      missingMaterial
    );
    damage.position.set(5, 5, -5);
    apcGroup.add(damage);

    scene.add(apcGroup);
    sceneObjects.push(apcGroup);
    return apcGroup;
  }

  function createStrippingStation(scene, x, y, z) {
    var stationGroup = new THREE.Group();
    stationGroup.position.set(x, y, z);

    var metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      metalness: 0.7,
      roughness: 0.4
    });

    // Work table
    var table = new THREE.Mesh(
      new THREE.BoxGeometry(20, 2, 15),
      metalMaterial
    );
    table.castShadow = true;
    table.receiveShadow = true;
    stationGroup.add(table);

    // Support legs
    for (var i = 0; i < 4; i++) {
      var leg = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 2, 8),
        metalMaterial
      );
      var offsetX = (i % 2 === 0) ? -8 : 8;
      var offsetZ = (i < 2) ? -6 : 6;
      leg.position.set(offsetX, 1, offsetZ);
      leg.castShadow = true;
      stationGroup.add(leg);
    }

    // Scattered weapon parts
    var partMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.5
    });
    var part1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 8, 6),
      partMaterial
    );
    part1.position.set(-5, 2.5, 0);
    part1.rotation.z = Math.PI / 4;
    stationGroup.add(part1);

    scene.add(stationGroup);
    sceneObjects.push(stationGroup);
    return stationGroup;
  }

  function createCampfire(scene, x, y, z) {
    var fireGroup = new THREE.Group();
    fireGroup.position.set(x, y, z);
    fireGroup.userData.type = 'campfire';
    fireGroup.userData.flicker = Math.random();

    // Fire logs
    var logMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      metalness: 0,
      roughness: 0.9
    });
    var log1 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 12, 8),
      logMaterial
    );
    log1.rotation.z = Math.PI / 3;
    log1.position.y = 1;
    fireGroup.add(log1);

    var log2 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 12, 8),
      logMaterial
    );
    log2.rotation.z = -Math.PI / 3;
    log2.position.y = 1;
    fireGroup.add(log2);

    // Flames (visual only)
    var flameMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b2d,
      emissive: 0xff6b2d,
      emissiveIntensity: 0.8,
      metalness: 0,
      roughness: 0.5,
      transparent: true,
      opacity: 0.7
    });
    var flame = new THREE.Mesh(
      new THREE.ConeGeometry(3, 8, 8),
      flameMaterial
    );
    flame.position.y = 5;
    fireGroup.add(flame);

    scene.add(fireGroup);
    return fireGroup;
  }

  function createKennel(scene, x, y, z) {
    var kennelGroup = new THREE.Group();
    kennelGroup.position.set(x, y, z);
    kennelGroup.userData.type = 'kennel';
    kennelGroup.userData.rattle = 0;

    var metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      metalness: 0.7,
      roughness: 0.5
    });

    // Cage frame
    var frame = new THREE.Mesh(
      new THREE.BoxGeometry(10, 8, 8),
      metalMaterial
    );
    frame.castShadow = true;
    frame.receiveShadow = true;
    kennelGroup.add(frame);

    // Bars (using line segments)
    var barGeometry = new THREE.BufferGeometry();
    var barPositions = [];
    for (var i = 0; i < 5; i++) {
      var barX = -5 + (i * 2.5);
      barPositions.push(barX, 0, -4, barX, 0, 4);
      barPositions.push(barX, 8, -4, barX, 8, 4);
    }
    barGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(barPositions), 3));
    var barMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    var bars = new THREE.LineSegments(barGeometry, barMaterial);
    kennelGroup.add(bars);

    scene.add(kennelGroup);
    return kennelGroup;
  }

  function createWatchtower(scene, x, y, z) {
    var towerGroup = new THREE.Group();
    towerGroup.position.set(x, y, z);

    var sheetMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b7a7a,
      metalness: 0.5,
      roughness: 0.7,
      map: null
    });

    // Main tower body
    var body = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 30, 12),
      sheetMaterial
    );
    body.position.y = 15;
    body.castShadow = true;
    body.receiveShadow = true;
    towerGroup.add(body);

    // Watch platform
    var platform = new THREE.Mesh(
      new THREE.CylinderGeometry(10, 10, 2, 12),
      sheetMaterial
    );
    platform.position.y = 30;
    platform.castShadow = true;
    towerGroup.add(platform);

    // Guard post
    var post = new THREE.Mesh(
      new THREE.BoxGeometry(4, 6, 4),
      sheetMaterial
    );
    post.position.set(0, 33, 0);
    post.castShadow = true;
    towerGroup.add(post);

    scene.add(towerGroup);
    sceneObjects.push(towerGroup);
    return towerGroup;
  }

  function createBarbedWirePerimeter(scene) {
    var wireGroup = new THREE.Group();

    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = [];

    // Create perimeter wire
    var radius = 150;
    var segments = 40;
    for (var i = 0; i <= segments; i++) {
      var angle = (i / segments) * Math.PI * 2;
      var x1 = Math.cos(angle) * radius;
      var z1 = Math.sin(angle) * radius;
      var x2 = Math.cos(angle) * (radius + 1);
      var z2 = Math.sin(angle) * (radius + 1);
      wirePositions.push(x1, 3, z1, x2, 3, z2);
    }

    wireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wirePositions), 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x8b4513, linewidth: 2 });
    var perimeter = new THREE.LineSegments(wireGeometry, wireMaterial);

    wireGroup.add(perimeter);
    scene.add(wireGroup);
    sceneObjects.push(wireGroup);
    return wireGroup;
  }

  function createBarricade(scene, x, y, z) {
    var barricadeGroup = new THREE.Group();
    barricadeGroup.position.set(x, y, z);

    var drumMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b2d,
      metalness: 0.6,
      roughness: 0.5
    });

    for (var i = 0; i < 3; i++) {
      var drum = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 4, 8),
        drumMaterial
      );
      drum.position.x = (i - 1) * 5;
      drum.castShadow = true;
      drum.receiveShadow = true;
      barricadeGroup.add(drum);
    }

    scene.add(barricadeGroup);
    sceneObjects.push(barricadeGroup);
    return barricadeGroup;
  }

  function createHelicopterSkeleton(scene, x, y, z) {
    var heliGroup = new THREE.Group();
    heliGroup.position.set(x, y, z);
    heliGroup.rotation.z = -0.3;

    var metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.4
    });

    // Fuselage
    var fuselage = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 20, 8),
      metalMaterial
    );
    fuselage.rotation.z = Math.PI / 2;
    fuselage.castShadow = true;
    heliGroup.add(fuselage);

    // Tail boom
    var tail = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 12, 6),
      metalMaterial
    );
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -10;
    tail.castShadow = true;
    heliGroup.add(tail);

    // Rotor hub area (stripped)
    var rotorHub = new THREE.Mesh(
      new THREE.SphereGeometry(3, 8, 8),
      metalMaterial
    );
    rotorHub.position.y = 0;
    rotorHub.castShadow = true;
    heliGroup.add(rotorHub);

    // Landing skids
    for (var i = 0; i < 2; i++) {
      var skid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 18, 6),
        metalMaterial
      );
      skid.rotation.z = Math.PI / 2;
      skid.position.y = -2;
      skid.position.z = (i === 0) ? -3 : 3;
      heliGroup.add(skid);
    }

    scene.add(heliGroup);
    sceneObjects.push(heliGroup);
    return heliGroup;
  }

  function update(delta) {
    for (var i = 0; i < sceneObjects.length; i++) {
      var obj = sceneObjects[i];

      if (obj.userData.type === 'craneMagnet') {
        // Swing the crane magnet
        obj.userData.angle += delta * 0.5;
        obj.position.x = Math.sin(obj.userData.angle) * 30;
        obj.position.z = Math.cos(obj.userData.angle) * 20;

        // Pulse the magnet coils
        var children = obj.children;
        for (var j = 0; j < children.length; j++) {
          if (children[j].material && children[j].material.emissive) {
            var pulse = 0.5 + Math.sin(obj.userData.angle * 3) * 0.3;
            children[j].material.emissiveIntensity = pulse;
          }
        }
      }

      if (obj.userData.type === 'campfire') {
        // Campfire flicker
        obj.userData.flicker += delta * 3;
        var flickerIntensity = 0.6 + Math.sin(obj.userData.flicker) * 0.2;
        var children = obj.children;
        for (var j = 0; j < children.length; j++) {
          if (children[j].material && children[j].material.emissive) {
            children[j].material.emissiveIntensity = flickerIntensity;
            children[j].scale.y = 0.8 + Math.sin(obj.userData.flicker * 1.5) * 0.2;
          }
        }
      }

      if (obj.userData.type === 'kennel') {
        // Kennel rattle
        obj.userData.rattle += delta;
        if (Math.random() > 0.95) {
          obj.userData.rattle = 0;
        }
        var rattleAmount = Math.sin(obj.userData.rattle * 20) * 0.3;
        obj.position.x += rattleAmount * delta;
      }
    }
  }

  function reset() {
    for (var i = 0; i < sceneObjects.length; i++) {
      var obj = sceneObjects[i];
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    }
    sceneObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
