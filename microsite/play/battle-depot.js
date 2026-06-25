window.BattleDepot = (function() {
  'use strict';

  var depotObjects = [];
  var searchlights = [];
  var burningVehicles = [];
  var scene = null;
  var camera = null;

  var COLORS = {
    oliveGreen: 0x556B2F,
    darkOlive: 0x3D4D1F,
    concrete: 0x888888,
    darkGray: 0x444444,
    silver: 0xC0C0C0,
    darkSilver: 0x808080,
    darkRed: 0x8B0000,
    orange: 0xFF8C00,
    yellow: 0xFFFF00,
    burnt: 0x2F2F2F,
    rust: 0xB7410E
  };

  function createWarehouse(x, y, z, width, height, depth) {
    var warehouseGroup = [];

    // Main warehouse box
    var boxGeom = new THREE.BoxGeometry(width, height, depth);
    var boxMat = new THREE.MeshPhongMaterial({ color: COLORS.oliveGreen });
    var warehouse = new THREE.Mesh(boxGeom, boxMat);
    warehouse.position.set(x, y + height / 2, z);
    warehouse.castShadow = true;
    warehouse.receiveShadow = true;
    scene.add(warehouse);
    warehouseGroup.push(warehouse);

    // Roof accent
    var roofGeom = new THREE.BoxGeometry(width + 2, 2, depth + 2);
    var roofMat = new THREE.MeshPhongMaterial({ color: COLORS.darkOlive });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(x, y + height + 1, z);
    roof.castShadow = true;
    scene.add(roof);
    warehouseGroup.push(roof);

    // Front doors (BoxGeometry)
    var doorW = width / 4;
    var doorGeom = new THREE.BoxGeometry(doorW, height * 0.8, 0.5);
    var doorMat = new THREE.MeshPhongMaterial({ color: COLORS.darkGray });
    var door1 = new THREE.Mesh(doorGeom, doorMat);
    door1.position.set(x - width / 4, y + height * 0.4, z + depth / 2 + 0.25);
    scene.add(door1);
    warehouseGroup.push(door1);

    var door2 = new THREE.Mesh(doorGeom, doorMat);
    door2.position.set(x + width / 4, y + height * 0.4, z + depth / 2 + 0.25);
    scene.add(door2);
    warehouseGroup.push(door2);

    return warehouseGroup;
  }

  function createLoadingDock(x, y, z, width, depth) {
    var dockGroup = [];

    // Raised platform
    var platformGeom = new THREE.BoxGeometry(width, 3, depth);
    var platformMat = new THREE.MeshPhongMaterial({ color: COLORS.concrete });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(x, y + 1.5, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    dockGroup.push(platform);

    // Support pillars
    for (var i = 0; i < 4; i++) {
      var px = x - width / 3 + (i * width / 3);
      var pillarGeom = new THREE.BoxGeometry(1, 3, 1);
      var pillarMat = new THREE.MeshPhongMaterial({ color: COLORS.darkGray });
      var pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(px, y + 1.5, z);
      pillar.castShadow = true;
      scene.add(pillar);
      dockGroup.push(pillar);
    }

    // Ramps (angled BoxGeometry)
    var rampGeom = new THREE.BoxGeometry(width * 0.4, 3, 2);
    var rampMat = new THREE.MeshPhongMaterial({ color: COLORS.concrete });
    var rampLeft = new THREE.Mesh(rampGeom, rampMat);
    rampLeft.position.set(x - width / 3, y + 1.5, z - depth / 2 - 1);
    rampLeft.rotation.z = Math.PI / 8;
    rampLeft.castShadow = true;
    scene.add(rampLeft);
    dockGroup.push(rampLeft);

    var rampRight = new THREE.Mesh(rampGeom, rampMat);
    rampRight.position.set(x + width / 3, y + 1.5, z - depth / 2 - 1);
    rampRight.rotation.z = -Math.PI / 8;
    rampRight.castShadow = true;
    scene.add(rampRight);
    dockGroup.push(rampRight);

    return dockGroup;
  }

  function createFuelTank(x, y, z, radius, height) {
    var tankGroup = [];

    // Cylindrical tank
    var tankGeom = new THREE.CylinderGeometry(radius, radius, height, 32);
    var tankMat = new THREE.MeshPhongMaterial({ color: COLORS.silver });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(x, y + height / 2, z);
    tank.castShadow = true;
    tank.receiveShadow = true;
    scene.add(tank);
    tankGroup.push(tank);

    // Tank top
    var capGeom = new THREE.CylinderGeometry(radius * 0.3, radius * 0.3, 1, 16);
    var capMat = new THREE.MeshPhongMaterial({ color: COLORS.darkSilver });
    var cap = new THREE.Mesh(capGeom, capMat);
    cap.position.set(x, y + height + 0.5, z);
    cap.castShadow = true;
    scene.add(cap);
    tankGroup.push(cap);

    // Berm walls (BoxGeometry)
    var bermGeom = new THREE.BoxGeometry(radius * 2.5, 2, radius * 2.5);
    var bermMat = new THREE.MeshPhongMaterial({ color: COLORS.darkOlive });
    var berm = new THREE.Mesh(bermGeom, bermMat);
    berm.position.set(x, y + 1, z);
    berm.castShadow = true;
    berm.receiveShadow = true;
    scene.add(berm);
    tankGroup.push(berm);

    return tankGroup;
  }

  function createMilitaryVehicle(x, y, z, type) {
    var vehicleGroup = [];

    if (type === 'truck') {
      // Truck body
      var bodyGeom = new THREE.BoxGeometry(2, 2.5, 5);
      var bodyMat = new THREE.MeshPhongMaterial({ color: COLORS.oliveGreen });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(x, y + 1.25, z);
      body.castShadow = true;
      scene.add(body);
      vehicleGroup.push(body);

      // Cab
      var cabGeom = new THREE.BoxGeometry(2, 2, 1.5);
      var cabMat = new THREE.MeshPhongMaterial({ color: COLORS.darkOlive });
      var cab = new THREE.Mesh(cabGeom, cabMat);
      cab.position.set(x, y + 1, z + 3);
      cab.castShadow = true;
      scene.add(cab);
      vehicleGroup.push(cab);

      // Wheels
      for (var w = 0; w < 4; w++) {
        var wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
        var wheelMat = new THREE.MeshPhongMaterial({ color: COLORS.darkGray });
        var wheel = new THREE.Mesh(wheelGeom, wheelMat);
        var wz = -2 + w * 1.3;
        wheel.position.set(x - 1.2, y + 0.6, z + wz);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        scene.add(wheel);
        vehicleGroup.push(wheel);

        var wheel2 = new THREE.Mesh(wheelGeom, wheelMat);
        wheel2.position.set(x + 1.2, y + 0.6, z + wz);
        wheel2.rotation.z = Math.PI / 2;
        wheel2.castShadow = true;
        scene.add(wheel2);
        vehicleGroup.push(wheel2);
      }
    } else if (type === 'apc') {
      // APC hull
      var hullGeom = new THREE.BoxGeometry(2.5, 2, 4);
      var hullMat = new THREE.MeshPhongMaterial({ color: COLORS.oliveGreen });
      var hull = new THREE.Mesh(hullGeom, hullMat);
      hull.position.set(x, y + 1, z);
      hull.castShadow = true;
      scene.add(hull);
      vehicleGroup.push(hull);

      // Turret
      var turretGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
      var turretMat = new THREE.MeshPhongMaterial({ color: COLORS.darkOlive });
      var turret = new THREE.Mesh(turretGeom, turretMat);
      turret.position.set(x, y + 2.3, z - 0.5);
      turret.castShadow = true;
      scene.add(turret);
      vehicleGroup.push(turret);

      // Wheels
      for (var w2 = 0; w2 < 3; w2++) {
        var wheelGeom2 = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16);
        var wheelMat2 = new THREE.MeshPhongMaterial({ color: COLORS.darkGray });
        var wheel3 = new THREE.Mesh(wheelGeom2, wheelMat2);
        var wz2 = -1.5 + w2 * 1.5;
        wheel3.position.set(x - 1.4, y + 0.5, z + wz2);
        wheel3.rotation.z = Math.PI / 2;
        wheel3.castShadow = true;
        scene.add(wheel3);
        vehicleGroup.push(wheel3);

        var wheel4 = new THREE.Mesh(wheelGeom2, wheelMat2);
        wheel4.position.set(x + 1.4, y + 0.5, z + wz2);
        wheel4.rotation.z = Math.PI / 2;
        wheel4.castShadow = true;
        scene.add(wheel4);
        vehicleGroup.push(wheel4);
      }
    } else if (type === 'jeep') {
      // Jeep body
      var jeepGeom = new THREE.BoxGeometry(1.5, 1.5, 2.5);
      var jeepMat = new THREE.MeshPhongMaterial({ color: COLORS.oliveGreen });
      var jeep = new THREE.Mesh(jeepGeom, jeepMat);
      jeep.position.set(x, y + 0.75, z);
      jeep.castShadow = true;
      scene.add(jeep);
      vehicleGroup.push(jeep);

      // Roll bar
      var barGeom = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
      var barMat = new THREE.MeshPhongMaterial({ color: COLORS.darkGray });
      var bar = new THREE.Mesh(barGeom, barMat);
      bar.position.set(x, y + 1.5, z - 0.3);
      scene.add(bar);
      vehicleGroup.push(bar);

      // Wheels
      for (var w3 = 0; w3 < 2; w3++) {
        var wheelGeom3 = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
        var wheelMat3 = new THREE.MeshPhongMaterial({ color: COLORS.darkGray });
        var wheel5 = new THREE.Mesh(wheelGeom3, wheelMat3);
        var wz3 = -0.8 + w3 * 1.6;
        wheel5.position.set(x - 0.8, y + 0.4, z + wz3);
        wheel5.rotation.z = Math.PI / 2;
        wheel5.castShadow = true;
        scene.add(wheel5);
        vehicleGroup.push(wheel5);

        var wheel6 = new THREE.Mesh(wheelGeom3, wheelMat3);
        wheel6.position.set(x + 0.8, y + 0.4, z + wz3);
        wheel6.rotation.z = Math.PI / 2;
        wheel6.castShadow = true;
        scene.add(wheel6);
        vehicleGroup.push(wheel6);
      }
    }

    return vehicleGroup;
  }

  function createMaintenanceBay(x, y, z) {
    var bayGroup = [];

    // Main building
    var bayGeom = new THREE.BoxGeometry(12, 6, 8);
    var bayMat = new THREE.MeshPhongMaterial({ color: COLORS.oliveGreen });
    var bay = new THREE.Mesh(bayGeom, bayMat);
    bay.position.set(x, y + 3, z);
    bay.castShadow = true;
    scene.add(bay);
    bayGroup.push(bay);

    // Open front (no mesh needed, just visual gap)
    // Support posts for open front
    var postGeom = new THREE.BoxGeometry(0.8, 6, 0.8);
    var postMat = new THREE.MeshPhongMaterial({ color: COLORS.concrete });
    var post1 = new THREE.Mesh(postGeom, postMat);
    post1.position.set(x - 5, y + 3, z + 4);
    post1.castShadow = true;
    scene.add(post1);
    bayGroup.push(post1);

    var post2 = new THREE.Mesh(postGeom, postMat);
    post2.position.set(x + 5, y + 3, z + 4);
    post2.castShadow = true;
    scene.add(post2);
    bayGroup.push(post2);

    // Vehicle lift (CylinderGeometry)
    var liftBaseGeom = new THREE.BoxGeometry(3, 0.5, 3);
    var liftMat = new THREE.MeshPhongMaterial({ color: COLORS.silver });
    var liftBase = new THREE.Mesh(liftBaseGeom, liftMat);
    liftBase.position.set(x, y + 0.25, z - 1);
    liftBase.castShadow = true;
    scene.add(liftBase);
    bayGroup.push(liftBase);

    var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 4, 16);
    var poleMat = new THREE.MeshPhongMaterial({ color: COLORS.darkSilver });
    var pole1 = new THREE.Mesh(poleGeom, poleMat);
    pole1.position.set(x - 1, y + 2, z - 1);
    pole1.castShadow = true;
    scene.add(pole1);
    bayGroup.push(pole1);

    var pole2 = new THREE.Mesh(poleGeom, poleMat);
    pole2.position.set(x + 1, y + 2, z - 1);
    pole2.castShadow = true;
    scene.add(pole2);
    bayGroup.push(pole2);

    // Vehicle on lift
    var vehicleOnLift = createMilitaryVehicle(x, y + 2.5, z - 1, 'truck');
    bayGroup = bayGroup.concat(vehicleOnLift);

    return bayGroup;
  }

  function createAmmoBunker(x, y, z, width, depth) {
    var bunkerGroup = [];

    // Bunker box (buried)
    var bunkerGeom = new THREE.BoxGeometry(width, 3, depth);
    var bunkerMat = new THREE.MeshPhongMaterial({ color: COLORS.darkGray });
    var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
    bunker.position.set(x, y + 1.5, z);
    bunker.castShadow = true;
    scene.add(bunker);
    bunkerGroup.push(bunker);

    // Earthen cover on top
    var coverGeom = new THREE.BoxGeometry(width + 1, 2, depth + 1);
    var coverMat = new THREE.MeshPhongMaterial({ color: COLORS.darkOlive });
    var cover = new THREE.Mesh(coverGeom, coverMat);
    cover.position.set(x, y + 3, z);
    cover.castShadow = true;
    scene.add(cover);
    bunkerGroup.push(cover);

    // Entrance (BoxGeometry)
    var entryGeom = new THREE.BoxGeometry(2, 2, 0.5);
    var entryMat = new THREE.MeshPhongMaterial({ color: COLORS.darkGray });
    var entry = new THREE.Mesh(entryGeom, entryMat);
    entry.position.set(x - width / 2 + 2, y + 2, z);
    entry.castShadow = true;
    scene.add(entry);
    bunkerGroup.push(entry);

    return bunkerGroup;
  }

  function createSupplyPallet(x, y, z) {
    var palletGroup = [];

    // Wooden pallet
    var palletGeom = new THREE.BoxGeometry(2, 0.3, 2);
    var palletMat = new THREE.MeshPhongMaterial({ color: COLORS.rust });
    var pallet = new THREE.Mesh(palletGeom, palletMat);
    pallet.position.set(x, y + 0.15, z);
    pallet.castShadow = true;
    scene.add(pallet);
    palletGroup.push(pallet);

    // Stacked boxes
    for (var i = 0; i < 3; i++) {
      var boxGeom = new THREE.BoxGeometry(1.8, 1, 1.8);
      var boxMat = new THREE.MeshPhongMaterial({ color: COLORS.concrete });
      var box = new THREE.Mesh(boxGeom, boxMat);
      box.position.set(x, y + 0.5 + i * 1, z);
      box.castShadow = true;
      scene.add(box);
      palletGroup.push(box);
    }

    // Strapping (LineSegments)
    var stripGeom = new THREE.BufferGeometry();
    var stripVertices = new Float32Array([
      -0.9, 2, -0.9,
      0.9, 2, -0.9,
      0.9, 2, 0.9,
      -0.9, 2, 0.9,
      -0.9, 3.2, -0.9,
      0.9, 3.2, -0.9,
      0.9, 3.2, 0.9,
      -0.9, 3.2, 0.9
    ]);
    stripGeom.setAttribute('position', new THREE.BufferAttribute(stripVertices, 3));
    var stripIndices = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
    stripGeom.setIndex(new THREE.BufferAttribute(new Uint16Array(stripIndices), 1));
    var stripMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    var straps = new THREE.LineSegments(stripGeom, stripMat);
    straps.position.set(x, y, z);
    scene.add(straps);
    palletGroup.push(straps);

    return palletGroup;
  }

  function createGuardTower(x, y, z) {
    var towerGroup = [];

    // Support pole
    var poleGeom = new THREE.CylinderGeometry(0.4, 0.5, 10, 16);
    var poleMat = new THREE.MeshPhongMaterial({ color: COLORS.concrete });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(x, y + 5, z);
    pole.castShadow = true;
    scene.add(pole);
    towerGroup.push(pole);

    // Platform
    var platformGeom = new THREE.BoxGeometry(4, 0.5, 4);
    var platformMat = new THREE.MeshPhongMaterial({ color: COLORS.concrete });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(x, y + 10.25, z);
    platform.castShadow = true;
    scene.add(platform);
    towerGroup.push(platform);

    // Guard shelter
    var shelterGeom = new THREE.BoxGeometry(2, 2, 2);
    var shelterMat = new THREE.MeshPhongMaterial({ color: COLORS.oliveGreen });
    var shelter = new THREE.Mesh(shelterGeom, shelterMat);
    shelter.position.set(x, y + 11.5, z);
    shelter.castShadow = true;
    scene.add(shelter);
    towerGroup.push(shelter);

    // Searchlight (CylinderGeometry)
    var lightGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 12);
    var lightMat = new THREE.MeshPhongMaterial({ color: COLORS.yellow });
    var light = new THREE.Mesh(lightGeom, lightMat);
    light.position.set(x, y + 12.8, z);
    light.castShadow = true;
    scene.add(light);
    towerGroup.push(light);
    searchlights.push({ mesh: light, position: light.position.clone(), rotation: 0 });

    return towerGroup;
  }

  function createPerimeterFence(x1, z1, x2, z2) {
    var fenceGroup = [];

    var dx = x2 - x1;
    var dz = z2 - z1;
    var distance = Math.sqrt(dx * dx + dz * dz);
    var angle = Math.atan2(dz, dx);
    var segments = Math.floor(distance / 4);

    for (var i = 0; i <= segments; i++) {
      var px = x1 + (dx / segments) * i;
      var pz = z1 + (dz / segments) * i;

      // Concrete post
      var postGeom = new THREE.BoxGeometry(0.4, 3, 0.4);
      var postMat = new THREE.MeshPhongMaterial({ color: COLORS.concrete });
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(px, 1.5, pz);
      post.castShadow = true;
      scene.add(post);
      fenceGroup.push(post);
    }

    // Wire mesh (LineSegments)
    var meshGeom = new THREE.BufferGeometry();
    var meshVertices = new Float32Array([]);
    var meshIndices = [];

    for (var s = 0; s < segments; s++) {
      var p1x = x1 + (dx / segments) * s;
      var p1z = z1 + (dz / segments) * s;
      var p2x = x1 + (dx / segments) * (s + 1);
      var p2z = z1 + (dz / segments) * (s + 1);

      var idx = s * 4;
      meshIndices.push(idx, idx + 1, idx, idx + 2, idx + 1, idx + 3, idx + 2, idx + 3);
    }

    if (meshIndices.length > 0) {
      var verts = [];
      for (var v = 0; v <= segments; v++) {
        var vx = x1 + (dx / segments) * v;
        var vz = z1 + (dz / segments) * v;
        verts.push(vx, 0.5, vz, vx, 3, vz);
      }
      meshGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));

      var fenceIndices = [];
      for (var f = 0; f < segments; f++) {
        var fidx = f * 2;
        fenceIndices.push(fidx, fidx + 1, fidx + 1, fidx + 3, fidx + 2, fidx + 3, fidx, fidx + 2);
      }
      meshGeom.setIndex(new THREE.BufferAttribute(new Uint16Array(fenceIndices), 1));
      var wireMat = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 1 });
      var wireFence = new THREE.LineSegments(meshGeom, wireMat);
      scene.add(wireFence);
      fenceGroup.push(wireFence);
    }

    return fenceGroup;
  }

  function createBurnedVehicle(x, y, z) {
    var burnedGroup = [];

    // Charred hull
    var hullGeom = new THREE.BoxGeometry(2.2, 2, 4.5);
    var hullMat = new THREE.MeshPhongMaterial({ color: COLORS.burnt });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(x, y + 1, z);
    hull.castShadow = true;
    scene.add(hull);
    burnedGroup.push(hull);

    // Destroyed wheels (half buried)
    for (var w = 0; w < 4; w++) {
      var wheelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12);
      var wheelMat = new THREE.MeshPhongMaterial({ color: COLORS.burnt });
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      var wz = -1.5 + (w % 2) * 3;
      var wx = w < 2 ? -1.2 : 1.2;
      wheel.position.set(x + wx, y + 0.3, z + wz);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      scene.add(wheel);
      burnedGroup.push(wheel);
    }

    // Fire/smoke effect (SphereGeometry)
    var fireGeom = new THREE.SphereGeometry(0.8, 8, 8);
    var fireMat = new THREE.MeshPhongMaterial({ color: COLORS.orange, emissive: COLORS.orange, emissiveIntensity: 0.5 });
    var fire = new THREE.Mesh(fireGeom, fireMat);
    fire.position.set(x, y + 2.5, z);
    scene.add(fire);
    burnedGroup.push(fire);
    burningVehicles.push({ mesh: fire, originalPos: fire.position.clone(), size: 0.8, phase: Math.random() * Math.PI * 2 });

    return burnedGroup;
  }

  function createAdminBuilding(x, y, z) {
    var adminGroup = [];

    // Main office
    var officeGeom = new THREE.BoxGeometry(6, 4, 5);
    var officeMat = new THREE.MeshPhongMaterial({ color: COLORS.oliveGreen });
    var office = new THREE.Mesh(officeGeom, officeMat);
    office.position.set(x, y + 2, z);
    office.castShadow = true;
    scene.add(office);
    adminGroup.push(office);

    // Roof
    var roofGeom = new THREE.BoxGeometry(6.5, 0.5, 5.5);
    var roofMat = new THREE.MeshPhongMaterial({ color: COLORS.darkOlive });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(x, y + 4.25, z);
    roof.castShadow = true;
    scene.add(roof);
    adminGroup.push(roof);

    // Flagpole (CylinderGeometry)
    var flagpoleGeom = new THREE.CylinderGeometry(0.15, 0.15, 6, 12);
    var flagpoleMat = new THREE.MeshPhongMaterial({ color: COLORS.darkGray });
    var flagpole = new THREE.Mesh(flagpoleGeom, flagpoleMat);
    flagpole.position.set(x + 2.5, y + 6, z - 2.5);
    flagpole.castShadow = true;
    scene.add(flagpole);
    adminGroup.push(flagpole);

    // Flag (BoxGeometry)
    var flagGeom = new THREE.BoxGeometry(1, 0.6, 0.1);
    var flagMat = new THREE.MeshPhongMaterial({ color: COLORS.rust });
    var flag = new THREE.Mesh(flagGeom, flagMat);
    flag.position.set(x + 3.2, y + 5.5, z - 2.5);
    flag.castShadow = true;
    scene.add(flag);
    adminGroup.push(flag);

    // Windows
    for (var i = 0; i < 6; i++) {
      var windowGeom = new THREE.BoxGeometry(0.8, 0.8, 0.1);
      var windowMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var window = new THREE.Mesh(windowGeom, windowMat);
      var winx = -2.5 + (i % 3) * 2.5;
      var winz = (i < 3 ? -2.2 : 2.2);
      window.position.set(x + winx, y + 2.5, z + winz);
      scene.add(window);
      adminGroup.push(window);
    }

    return adminGroup;
  }

  function createHelicopterPad(x, y, z) {
    var padGroup = [];

    // Concrete pad
    var padGeom = new THREE.BoxGeometry(15, 0.5, 15);
    var padMat = new THREE.MeshPhongMaterial({ color: COLORS.concrete });
    var pad = new THREE.Mesh(padGeom, padMat);
    pad.position.set(x, y + 0.25, z);
    pad.receiveShadow = true;
    scene.add(pad);
    padGroup.push(pad);

    // H marking (LineSegments)
    var hGeom = new THREE.BufferGeometry();
    var hVertices = new Float32Array([
      -3, 0.5, -2, -3, 0.5, 2,
      -3, 0.5, 0, 3, 0.5, 0,
      3, 0.5, -2, 3, 0.5, 2
    ]);
    hGeom.setAttribute('position', new THREE.BufferAttribute(hVertices, 3));
    var hIndices = [0, 1, 2, 3, 4, 5];
    hGeom.setIndex(new THREE.BufferAttribute(new Uint16Array(hIndices), 1));
    var hMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 3 });
    var hMarking = new THREE.LineSegments(hGeom, hMat);
    hMarking.position.set(x, y + 0.6, z);
    scene.add(hMarking);
    padGroup.push(hMarking);

    // Crashed helicopter (BoxGeometry body + CylinderGeometry rotors)
    var chopBodyGeom = new THREE.BoxGeometry(3, 1.5, 6);
    var chopBodyMat = new THREE.MeshPhongMaterial({ color: COLORS.darkOlive });
    var chopBody = new THREE.Mesh(chopBodyGeom, chopBodyMat);
    chopBody.position.set(x, y + 0.75, z - 6);
    chopBody.rotation.z = Math.PI / 8;
    chopBody.castShadow = true;
    scene.add(chopBody);
    padGroup.push(chopBody);

    // Main rotor (broken, tilted)
    var rotorGeom = new THREE.CylinderGeometry(2.5, 2.5, 0.2, 4);
    var rotorMat = new THREE.MeshPhongMaterial({ color: COLORS.darkGray });
    var rotor = new THREE.Mesh(rotorGeom, rotorMat);
    rotor.position.set(x, y + 2.5, z - 6);
    rotor.rotation.z = Math.PI / 6;
    rotor.castShadow = true;
    scene.add(rotor);
    padGroup.push(rotor);

    // Tail boom
    var tailGeom = new THREE.BoxGeometry(0.3, 0.3, 3);
    var tailMat = new THREE.MeshPhongMaterial({ color: COLORS.darkOlive });
    var tail = new THREE.Mesh(tailGeom, tailMat);
    tail.position.set(x - 1.5, y + 0.8, z - 8);
    tail.rotation.z = -Math.PI / 12;
    tail.castShadow = true;
    scene.add(tail);
    padGroup.push(tail);

    // Tail rotor
    var tailRotorGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.15, 4);
    var tailRotorMat = new THREE.MeshPhongMaterial({ color: COLORS.darkGray });
    var tailRotor = new THREE.Mesh(tailRotorGeom, tailRotorMat);
    tailRotor.position.set(x - 1.5, y + 1.2, z - 9.5);
    tailRotor.rotation.x = Math.PI / 6;
    tailRotor.castShadow = true;
    scene.add(tailRotor);
    padGroup.push(tailRotor);

    return padGroup;
  }

  function init(sceneIn, cameraIn) {
    scene = sceneIn;
    camera = cameraIn;
    depotObjects = [];
    searchlights = [];
    burningVehicles = [];

    // Warehouse buildings
    depotObjects = depotObjects.concat(createWarehouse(-25, 0, -10, 20, 12, 18));
    depotObjects = depotObjects.concat(createWarehouse(0, 0, 10, 18, 10, 22));
    depotObjects = depotObjects.concat(createWarehouse(20, 0, -15, 16, 11, 15));
    depotObjects = depotObjects.concat(createWarehouse(30, 0, 10, 14, 9, 20));

    // Loading docks
    depotObjects = depotObjects.concat(createLoadingDock(-25, 12, 0, 18, 12));
    depotObjects = depotObjects.concat(createLoadingDock(0, 10, 25, 16, 10));

    // Fuel storage area
    depotObjects = depotObjects.concat(createFuelTank(-35, 0, 20, 3, 8));
    depotObjects = depotObjects.concat(createFuelTank(-30, 0, 28, 2.5, 6));
    depotObjects = depotObjects.concat(createFuelTank(-38, 0, 30, 2.2, 5));

    // Motor pool vehicles
    for (var i = 0; i < 5; i++) {
      depotObjects = depotObjects.concat(createMilitaryVehicle(-20 + i * 3, 0, -30, 'truck'));
    }
    for (var i2 = 0; i2 < 4; i2++) {
      depotObjects = depotObjects.concat(createMilitaryVehicle(-10 + i2 * 3.5, 0, -25, 'apc'));
    }
    for (var i3 = 0; i3 < 6; i3++) {
      depotObjects = depotObjects.concat(createMilitaryVehicle(5 + i3 * 2.5, 0, -35, 'jeep'));
    }

    // Maintenance bay
    depotObjects = depotObjects.concat(createMaintenanceBay(-15, 0, 15));

    // Ammo bunkers
    depotObjects = depotObjects.concat(createAmmoBunker(15, 0, -25, 10, 8));
    depotObjects = depotObjects.concat(createAmmoBunker(25, 0, -30, 8, 6));

    // Supply pallets
    for (var p = 0; p < 8; p++) {
      var px = -30 + (p % 4) * 4;
      var pz = -20 + Math.floor(p / 4) * 4;
      depotObjects = depotObjects.concat(createSupplyPallet(px, 0, pz));
    }

    // Guard towers
    depotObjects = depotObjects.concat(createGuardTower(-40, 0, -35));
    depotObjects = depotObjects.concat(createGuardTower(35, 0, 35));
    depotObjects = depotObjects.concat(createGuardTower(-38, 0, 35));
    depotObjects = depotObjects.concat(createGuardTower(38, 0, -32));

    // Perimeter fence
    depotObjects = depotObjects.concat(createPerimeterFence(-40, -40, 40, -40));
    depotObjects = depotObjects.concat(createPerimeterFence(40, -40, 40, 40));
    depotObjects = depotObjects.concat(createPerimeterFence(40, 40, -40, 40));
    depotObjects = depotObjects.concat(createPerimeterFence(-40, 40, -40, -40));

    // Burned vehicle wreckage
    depotObjects = depotObjects.concat(createBurnedVehicle(10, 0, 5));
    depotObjects = depotObjects.concat(createBurnedVehicle(-5, 0, 28));

    // Admin building
    depotObjects = depotObjects.concat(createAdminBuilding(35, 0, 5));

    // Helicopter pad
    depotObjects = depotObjects.concat(createHelicopterPad(15, 0, 35));

    return depotObjects.length;
  }

  function update(delta) {
    // Animate searchlights
    for (var s = 0; s < searchlights.length; s++) {
      searchlights[s].rotation += delta * 0.5;
      var angle = searchlights[s].rotation;
      searchlights[s].mesh.rotation.y = angle;
    }

    // Animate fire effects on burning vehicles
    for (var b = 0; b < burningVehicles.length; b++) {
      var fire = burningVehicles[b];
      fire.phase += delta * 3;
      var pulse = 0.8 + Math.sin(fire.phase) * 0.2;
      fire.mesh.scale.set(pulse, pulse, pulse);

      var flicker = 0.4 + Math.sin(fire.phase * 0.7) * 0.3;
      fire.mesh.material.emissiveIntensity = flicker;
      fire.mesh.material.color.setHex(COLORS.orange);
      if (Math.sin(fire.phase * 1.3) > 0.5) {
        fire.mesh.material.color.setHex(COLORS.darkRed);
      }
    }
  }

  function reset() {
    // Remove all depot objects from scene
    for (var i = 0; i < depotObjects.length; i++) {
      if (depotObjects[i] && depotObjects[i].geometry) {
        depotObjects[i].geometry.dispose();
      }
      if (depotObjects[i] && depotObjects[i].material) {
        if (Array.isArray(depotObjects[i].material)) {
          for (var m = 0; m < depotObjects[i].material.length; m++) {
            depotObjects[i].material[m].dispose();
          }
        } else {
          depotObjects[i].material.dispose();
        }
      }
      if (depotObjects[i] && scene) {
        scene.remove(depotObjects[i]);
      }
    }

    depotObjects = [];
    searchlights = [];
    burningVehicles = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
