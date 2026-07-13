window.WestminsterPalace = (function() {
  'use strict';

  var scene = null;
  var londonEyeGroup = null;
  var objects = [];

  var ox = 4680;
  var oz = 2200;

  function addbox(sc, w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    sc.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addcone(sc, radius, height, color, x, y, z) {
    var geo = new THREE.ConeGeometry(radius, height, 4);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    sc.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addcylinder(sc, rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    sc.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildPalaceOfWestminster(sc) {
    var bx = ox + 0;
    var bz = oz + 0;

    // Main body — long Gothic Revival palace
    addbox(sc, 70, 20, 14, 0xD4A017, bx, 10, bz);

    // Vertical buttress elements along the facade
    var i;
    for (i = 0; i < 14; i++) {
      addbox(sc, 2, 22, 2, 0xC8960C, bx - 30 + i * 5, 11, bz - 7);
      addcone(sc, 0.7, 3, 0xB8860B, bx - 30 + i * 5, 23, bz - 7);
    }
    for (i = 0; i < 14; i++) {
      addbox(sc, 2, 22, 2, 0xC8960C, bx - 30 + i * 5, 11, bz + 7);
      addcone(sc, 0.7, 3, 0xB8860B, bx - 30 + i * 5, 23, bz + 7);
    }

    // Hundreds of Gothic pinnacles on top of the main body
    for (i = 0; i < 20; i++) {
      addcone(sc, 0.4, 2.5, 0xB8860B, bx - 33 + i * 3.5, 21.5, bz - 6);
      addcone(sc, 0.4, 2.5, 0xB8860B, bx - 33 + i * 3.5, 21.5, bz + 6);
      addcone(sc, 0.4, 2.5, 0xB8860B, bx - 33 + i * 3.5, 21.5, bz);
    }
    for (i = 0; i < 10; i++) {
      addcone(sc, 0.3, 2, 0xC8960C, bx - 32 + i * 7, 22, bz - 3);
      addcone(sc, 0.3, 2, 0xC8960C, bx - 32 + i * 7, 22, bz + 3);
    }

    // Victoria Tower — SW corner (10x10x28)
    addbox(sc, 10, 28, 10, 0xD4A017, bx - 35, 14, bz);
    // Victoria Tower pinnacles
    addcone(sc, 1.2, 5, 0xB8860B, bx - 35, 29, bz);
    addcone(sc, 0.6, 3, 0xB8860B, bx - 39, 29, bz - 4);
    addcone(sc, 0.6, 3, 0xB8860B, bx - 39, 29, bz + 4);
    addcone(sc, 0.6, 3, 0xB8860B, bx - 31, 29, bz - 4);
    addcone(sc, 0.6, 3, 0xB8860B, bx - 31, 29, bz + 4);

    // Central Hall dome-like feature (box approximation)
    addbox(sc, 12, 24, 12, 0xD4A017, bx, 12, bz);
    addcone(sc, 2, 6, 0xB8860B, bx, 27, bz);

    // Speaker's court internal courtyard suggestion
    addbox(sc, 8, 18, 8, 0xC8960C, bx + 15, 9, bz);
    addcone(sc, 1, 4, 0xB8860B, bx + 15, 20, bz);

    // NE corner position for Clock Tower / Big Ben (built separately)
    // This marks the connection point
    addbox(sc, 3, 20, 3, 0xD4A017, bx + 35, 10, bz - 5);
  }

  function buildBigBen(sc) {
    var bx = ox + 40;
    var bz = oz - 10;

    // Elizabeth Tower main shaft (6x6x32)
    addbox(sc, 6, 32, 6, 0xD4A017, bx, 16, bz);

    // Base plinth
    addbox(sc, 8, 4, 8, 0xC8960C, bx, 2, bz);

    // Middle decorative band
    addbox(sc, 7, 2, 7, 0xC8960C, bx, 18, bz);

    // Belfry stage — slightly wider
    addbox(sc, 7, 6, 7, 0xD4A017, bx, 34, bz);

    // Clock faces — golden panels on each of 4 sides at y=24
    addbox(sc, 5, 4, 0.5, 0xFFD700, bx, 24, bz - 3.3);
    addbox(sc, 5, 4, 0.5, 0xFFD700, bx, 24, bz + 3.3);
    addbox(sc, 0.5, 4, 5, 0xFFD700, bx - 3.3, 24, bz);
    addbox(sc, 0.5, 4, 5, 0xFFD700, bx + 3.3, 24, bz);

    // Spire on top
    addcone(sc, 1.5, 8, 0xB8860B, bx, 41, bz);

    // Gothic corner pinnacles at top of belfry
    addcone(sc, 0.5, 3, 0xB8860B, bx - 3.5, 38, bz - 3.5);
    addcone(sc, 0.5, 3, 0xB8860B, bx + 3.5, 38, bz - 3.5);
    addcone(sc, 0.5, 3, 0xB8860B, bx - 3.5, 38, bz + 3.5);
    addcone(sc, 0.5, 3, 0xB8860B, bx + 3.5, 38, bz + 3.5);

    // Smaller mid-level pinnacles
    addcone(sc, 0.35, 2, 0xB8860B, bx - 3, 29, bz - 3);
    addcone(sc, 0.35, 2, 0xB8860B, bx + 3, 29, bz - 3);
    addcone(sc, 0.35, 2, 0xB8860B, bx - 3, 29, bz + 3);
    addcone(sc, 0.35, 2, 0xB8860B, bx + 3, 29, bz + 3);
  }

  function buildWestminsterBridge(sc) {
    var bx = ox + 20;
    var bz = oz + 60;

    // Road deck (50 long x 8 wide)
    addbox(sc, 50, 1.5, 8, 0x006400, bx, 1, bz);

    // 7 supporting piers
    var i;
    for (i = 0; i < 7; i++) {
      addbox(sc, 3, 8, 6, 0x228B22, bx - 24 + i * 8, -3, bz);
    }

    // Bridge parapets
    addbox(sc, 50, 1, 0.5, 0x005000, bx, 2.5, bz - 4);
    addbox(sc, 50, 1, 0.5, 0x005000, bx, 2.5, bz + 4);

    // Decorative lamp posts on bridge
    var j;
    for (j = 0; j < 6; j++) {
      addcylinder(sc, 0.1, 0.1, 3, 6, 0x006400, bx - 20 + j * 8, 3.5, bz - 3.8);
      addcylinder(sc, 0.1, 0.1, 3, 6, 0x006400, bx - 20 + j * 8, 3.5, bz + 3.8);
    }
  }

  function buildWestminsterAbbey(sc) {
    var bx = ox - 30;
    var bz = oz - 40;

    // Main nave (35x14x12)
    addbox(sc, 35, 14, 12, 0xB8B8B0, bx, 7, bz);

    // Choir / chancel extension
    addbox(sc, 15, 12, 10, 0xA8A8A0, bx + 25, 6, bz);

    // Twin western towers (5x5x20 each)
    addbox(sc, 5, 20, 5, 0xB8B8B0, bx - 20, 10, bz - 5);
    addbox(sc, 5, 20, 5, 0xB8B8B0, bx - 20, 10, bz + 5);

    // Cone tops on western towers
    addcone(sc, 1.5, 5, 0xA0A09A, bx - 20, 22, bz - 5);
    addcone(sc, 1.5, 5, 0xA0A09A, bx - 20, 22, bz + 5);

    // Flying buttresses (angled box approximations)
    var i;
    for (i = 0; i < 6; i++) {
      addbox(sc, 0.8, 0.8, 5, 0xA8A8A0, bx - 10 + i * 6, 10, bz - 9);
      addbox(sc, 0.8, 0.8, 5, 0xA8A8A0, bx - 10 + i * 6, 10, bz + 9);
    }

    // Central crossing tower
    addbox(sc, 8, 18, 8, 0xB8B8B0, bx + 5, 9, bz);
    addcone(sc, 2, 6, 0xA0A09A, bx + 5, 21, bz);

    // Pinnacles on nave
    for (i = 0; i < 8; i++) {
      addcone(sc, 0.5, 2.5, 0xA0A09A, bx - 14 + i * 4, 15, bz - 5);
      addcone(sc, 0.5, 2.5, 0xA0A09A, bx - 14 + i * 4, 15, bz + 5);
    }

    // Henry VII Lady Chapel (eastern end)
    addbox(sc, 10, 10, 10, 0xB8B8B0, bx + 37, 5, bz);
    addcone(sc, 1.5, 4, 0xA0A09A, bx + 37, 13, bz);
  }

  function buildHorseGuardsParade(sc) {
    var bx = ox - 60;
    var bz = oz - 20;

    // Large gravel plaza
    addbox(sc, 40, 0.5, 30, 0xD2B48C, bx, 0, bz);

    // Mounted sentry boxes
    addbox(sc, 4, 5, 4, 0xC8A882, bx - 15, 2.5, bz - 10);
    addbox(sc, 4, 5, 4, 0xC8A882, bx + 15, 2.5, bz - 10);
    addbox(sc, 4, 5, 4, 0xC8A882, bx - 15, 2.5, bz + 10);
    addbox(sc, 4, 5, 4, 0xC8A882, bx + 15, 2.5, bz + 10);

    // Roof cones on sentry boxes
    addcone(sc, 2.5, 2, 0xB8860B, bx - 15, 6, bz - 10);
    addcone(sc, 2.5, 2, 0xB8860B, bx + 15, 6, bz - 10);
    addcone(sc, 2.5, 2, 0xB8860B, bx - 15, 6, bz + 10);
    addcone(sc, 2.5, 2, 0xB8860B, bx + 15, 6, bz + 10);

    // Cylindrical cannon decorations
    addcylinder(sc, 0.4, 0.4, 4, 8, 0x2F2F2F, bx - 8, 1, bz - 12);
    addcylinder(sc, 0.4, 0.4, 4, 8, 0x2F2F2F, bx + 8, 1, bz - 12);
    addcylinder(sc, 0.4, 0.4, 4, 8, 0x2F2F2F, bx - 8, 1, bz + 12);
    addcylinder(sc, 0.4, 0.4, 4, 8, 0x2F2F2F, bx + 8, 1, bz + 12);

    // Arch gateway to Whitehall
    addbox(sc, 10, 8, 2, 0xD2B48C, bx, 4, bz - 15);
    addbox(sc, 2, 8, 2, 0xD2B48C, bx - 5, 4, bz - 15);
    addbox(sc, 2, 8, 2, 0xD2B48C, bx + 5, 4, bz - 15);
  }

  function buildDowningStreet(sc) {
    var bx = ox - 80;
    var bz = oz - 10;

    // Row of Georgian terraced houses
    var i;
    for (i = 0; i < 8; i++) {
      addbox(sc, 7, 12, 10, 0x1C1C1C, bx + i * 8, 6, bz);
      // Window suggestion boxes
      addbox(sc, 1.5, 1.5, 0.3, 0x8B8B6B, bx + i * 8 - 2, 9, bz - 5.1);
      addbox(sc, 1.5, 1.5, 0.3, 0x8B8B6B, bx + i * 8 + 2, 9, bz - 5.1);
      addbox(sc, 1.5, 1.5, 0.3, 0x8B8B6B, bx + i * 8 - 2, 5, bz - 5.1);
      addbox(sc, 1.5, 1.5, 0.3, 0x8B8B6B, bx + i * 8 + 2, 5, bz - 5.1);
    }

    // No. 10 Downing Street — iconic black door
    addbox(sc, 1.2, 2.5, 0.2, 0x080808, bx, 1.25, bz - 5.2);
    // Door pillars
    addcylinder(sc, 0.15, 0.15, 2.5, 6, 0xFFFFFF, bx - 0.8, 1.25, bz - 5.1);
    addcylinder(sc, 0.15, 0.15, 2.5, 6, 0xFFFFFF, bx + 0.8, 1.25, bz - 5.1);

    // Street surface
    addbox(sc, 65, 0.3, 6, 0x404040, bx + 28, 0.1, bz - 8);

    // Security gates
    addbox(sc, 0.3, 4, 6, 0x555555, bx - 5, 2, bz - 8);
    addbox(sc, 0.3, 4, 6, 0x555555, bx + 60, 2, bz - 8);
  }

  function buildChurchillWarRooms(sc) {
    var bx = ox - 70;
    var bz = oz + 10;

    // Low blast-proof bunker building
    addbox(sc, 20, 4, 15, 0x696969, bx, 2, bz);

    // Blast-proof reinforced wall
    addbox(sc, 22, 5, 2, 0x5A5A5A, bx, 2.5, bz - 8);

    // Entrance steps
    addbox(sc, 5, 0.5, 3, 0x707070, bx - 3, 0.25, bz - 9);
    addbox(sc, 5, 0.5, 3, 0x606060, bx - 3, 0.75, bz - 9.5);

    // Sandbags suggestion — small boxes
    var i;
    for (i = 0; i < 6; i++) {
      addbox(sc, 1.5, 0.8, 0.8, 0x8B7355, bx - 8 + i * 1.6, 4.4, bz - 8.5);
    }
    for (i = 0; i < 6; i++) {
      addbox(sc, 1.5, 0.8, 0.8, 0x8B7355, bx + 2 + i * 1.6, 4.4, bz - 8.5);
    }

    // Ventilation shaft cylinders on roof
    addcylinder(sc, 0.4, 0.4, 1.5, 6, 0x4A4A4A, bx - 6, 5, bz);
    addcylinder(sc, 0.4, 0.4, 1.5, 6, 0x4A4A4A, bx, 5, bz);
    addcylinder(sc, 0.4, 0.4, 1.5, 6, 0x4A4A4A, bx + 6, 5, bz);
  }

  function buildCenotaph(sc) {
    var bx = ox - 55;
    var bz = oz - 15;

    // Tall slim Portland stone column (2x2x10)
    addbox(sc, 2, 10, 2, 0xFFFFFF, bx, 5, bz);

    // Base plinth
    addbox(sc, 4, 1.5, 4, 0xF5F5F5, bx, 0.75, bz);
    addbox(sc, 3, 0.8, 3, 0xF5F5F5, bx, 1.7, bz);

    // Top slab
    addbox(sc, 3, 0.8, 3, 0xF5F5F5, bx, 10.4, bz);

    // Wreath decorations — flat box rings (approximated as thin boxes)
    addbox(sc, 2.5, 0.3, 0.4, 0x228B22, bx, 8, bz - 1.1);
    addbox(sc, 2.5, 0.3, 0.4, 0x228B22, bx, 8, bz + 1.1);
    addbox(sc, 0.4, 0.3, 2.5, 0x228B22, bx - 1.1, 8, bz);
    addbox(sc, 0.4, 0.3, 2.5, 0x228B22, bx + 1.1, 8, bz);

    addbox(sc, 2.5, 0.3, 0.4, 0x228B22, bx, 4, bz - 1.1);
    addbox(sc, 2.5, 0.3, 0.4, 0x228B22, bx, 4, bz + 1.1);
    addbox(sc, 0.4, 0.3, 2.5, 0x228B22, bx - 1.1, 4, bz);
    addbox(sc, 0.4, 0.3, 2.5, 0x228B22, bx + 1.1, 4, bz);

    // Flags on either side (thin box poles + colored panels)
    addbox(sc, 0.1, 6, 0.1, 0x888888, bx - 3, 3, bz);
    addbox(sc, 0.1, 6, 0.1, 0x888888, bx + 3, 3, bz);
    addbox(sc, 2, 1.2, 0.05, 0xCC0000, bx - 3, 5.5, bz);
    addbox(sc, 2, 1.2, 0.05, 0xCC0000, bx + 3, 5.5, bz);
  }

  function buildThamesEmbankment(sc) {
    var bx = ox + 10;
    var bz = oz + 45;

    // Riverside walkway (Victoria Embankment)
    addbox(sc, 100, 0.5, 10, 0x888888, bx, 0, bz);

    // Embankment wall facing Thames
    addbox(sc, 100, 3, 1, 0x777777, bx, 1.5, bz + 5);

    // Victorian lamp posts (CylinderGeometry bases + box tops)
    var i;
    for (i = 0; i < 12; i++) {
      addcylinder(sc, 0.12, 0.18, 5, 6, 0x1A1A1A, bx - 45 + i * 9, 2.75, bz - 3);
      addbox(sc, 0.6, 0.6, 0.6, 0xFFD700, bx - 45 + i * 9, 5.5, bz - 3);
    }

    // Victoria Embankment gardens (green sections)
    addbox(sc, 40, 0.4, 12, 0x228B22, bx - 30, 0.2, bz - 10);
    addbox(sc, 30, 0.4, 12, 0x2D7A2D, bx + 25, 0.2, bz - 10);

    // Garden benches
    for (i = 0; i < 5; i++) {
      addbox(sc, 2, 0.3, 0.8, 0x8B6914, bx - 38 + i * 8, 0.5, bz - 8);
    }

    // Cleopatra's Needle obelisk (box approximation)
    addbox(sc, 1.5, 18, 1.5, 0xD2A679, bx - 10, 9, bz - 4);
    addcone(sc, 0.9, 3, 0xDAA040, bx - 10, 19.5, bz - 4);
    addbox(sc, 3, 1, 3, 0xC8956B, bx - 10, 0.5, bz - 4);
    // Sphinx guardians
    addbox(sc, 2, 1.5, 1, 0xC09060, bx - 13, 0.75, bz - 4);
    addbox(sc, 2, 1.5, 1, 0xC09060, bx - 7, 0.75, bz - 4);
  }

  function buildLondonEye(sc) {
    var bx = ox + 80;
    var bz = oz + 50;

    londonEyeGroup = new THREE.Group();
    londonEyeGroup.position.set(bx, 15, bz);
    sc.add(londonEyeGroup);

    // Outer rim — approximated as a flat cylinder ring
    // Using a large cylinder for the rim
    var rimGeo = new THREE.CylinderGeometry(15, 15, 0.5, 32);
    var rimMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    londonEyeGroup.add(rimMesh);
    objects.push(rimMesh);

    // Inner hub cylinder
    var hubGeo = new THREE.CylinderGeometry(1.5, 1.5, 1, 12);
    var hubMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    var hubMesh = new THREE.Mesh(hubGeo, hubMat);
    hubMesh.rotation.x = Math.PI / 2;
    londonEyeGroup.add(hubMesh);
    objects.push(hubMesh);

    // 32 gondola capsules arranged around the rim
    var capsuleCount = 32;
    var j;
    for (j = 0; j < capsuleCount; j++) {
      var angle = (j / capsuleCount) * Math.PI * 2;
      var cx = Math.cos(angle) * 15;
      var cy = Math.sin(angle) * 15;
      var capsuleGeo = new THREE.BoxGeometry(1.2, 0.8, 2.2);
      var capsuleMat = new THREE.MeshLambertMaterial({ color: 0xE8E8E8 });
      var capsuleMesh = new THREE.Mesh(capsuleGeo, capsuleMat);
      capsuleMesh.position.set(cx, cy, 0);
      londonEyeGroup.add(capsuleMesh);
      objects.push(capsuleMesh);
    }

    // Support legs (A-frame style)
    var leg1Geo = new THREE.BoxGeometry(1.2, 18, 1.2);
    var legMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
    var leg1 = new THREE.Mesh(leg1Geo, legMat);
    leg1.position.set(-5, -6, 2);
    leg1.rotation.z = 0.25;
    londonEyeGroup.add(leg1);
    objects.push(leg1);

    var leg2Geo = new THREE.BoxGeometry(1.2, 18, 1.2);
    var leg2 = new THREE.Mesh(leg2Geo, legMat);
    leg2.position.set(5, -6, 2);
    leg2.rotation.z = -0.25;
    londonEyeGroup.add(leg2);
    objects.push(leg2);

    // Spoke cables — thin boxes from hub to rim
    var spokeCount = 16;
    var k;
    for (k = 0; k < spokeCount; k++) {
      var sang = (k / spokeCount) * Math.PI * 2;
      var sx = Math.cos(sang) * 7.5;
      var sy = Math.sin(sang) * 7.5;
      var spokeGeo = new THREE.BoxGeometry(0.15, 15, 0.15);
      var spokeMat = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
      var spokeMesh = new THREE.Mesh(spokeGeo, spokeMat);
      spokeMesh.position.set(sx, sy, 0);
      spokeMesh.rotation.z = sang + Math.PI / 2;
      londonEyeGroup.add(spokeMesh);
      objects.push(spokeMesh);
    }
  }

  function buildSurroundingContext(sc) {
    // Thames river suggestion — wide blue-grey surface
    addbox(sc, 200, 0.2, 50, 0x1A3A5C, ox + 30, -0.2, oz + 70);

    // Whitehall road
    addbox(sc, 8, 0.3, 80, 0x333333, ox - 60, 0.1, oz - 15);

    // Parliament Square gardens
    addbox(sc, 25, 0.4, 25, 0x2E7D32, ox - 20, 0.1, oz - 35);

    // Street Trees — cylinder trunks + sphere canopies approximated with cones
    var i;
    for (i = 0; i < 8; i++) {
      addcylinder(sc, 0.25, 0.3, 3, 6, 0x5C3D11, ox - 40 + i * 8, 1.5, oz - 50);
      addcone(sc, 2, 4, 0x2E5E2E, ox - 40 + i * 8, 5, oz - 50);
    }

    // St. James's Park suggestion (distant greenery)
    addbox(sc, 60, 0.4, 40, 0x1B5E20, ox - 110, 0.1, oz - 30);
  }

  function init(sc) {
    scene = sc;
    objects = [];
    londonEyeGroup = null;

    buildPalaceOfWestminster(sc);
    buildBigBen(sc);
    buildWestminsterBridge(sc);
    buildWestminsterAbbey(sc);
    buildHorseGuardsParade(sc);
    buildDowningStreet(sc);
    buildChurchillWarRooms(sc);
    buildCenotaph(sc);
    buildThamesEmbankment(sc);
    buildLondonEye(sc);
    buildSurroundingContext(sc);
  }

  function update(delta) {
    if (londonEyeGroup) {
      londonEyeGroup.rotation.z += 0.02 * (delta || 0.016);
    }
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      if (objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      }
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        objects[i].material.dispose();
      }
    }
    objects = [];
    if (londonEyeGroup && londonEyeGroup.parent) {
      londonEyeGroup.parent.remove(londonEyeGroup);
    }
    londonEyeGroup = null;
    scene = null;
  }

  return { init: init, update: update, reset: reset };

}());
