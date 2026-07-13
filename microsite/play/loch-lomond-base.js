window.LochLomondBase = (function() {
  'use strict';

  var WX = 1960;
  var WZ = 2200;

  function makebox(scene, w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    scene.add(mesh);
    return mesh;
  }

  function makecylinder(scene, rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    scene.add(mesh);
    return mesh;
  }

  function makecone(scene, r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    scene.add(mesh);
    return mesh;
  }

  function makesphere(scene, r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    scene.add(mesh);
    return mesh;
  }

  function buildbenlomondmountain(scene) {
    // Ben Lomond: 6 box tiers, colours from dark forest base to grey-white snow cap
    // Tiers get narrower and brighter toward the summit at 26 units height
    var tiers = [
      { w: 38, h: 5, d: 38, color: 0x5A6A4A, y: 2.5,  ox: 0, oz: 0   },
      { w: 30, h: 5, d: 30, color: 0x6A7A5A, y: 7.5,  ox: 0, oz: 0   },
      { w: 22, h: 5, d: 22, color: 0x7A8A6A, y: 12.5, ox: 0, oz: 0   },
      { w: 15, h: 4, d: 15, color: 0x9A9A8A, y: 17,   ox: 0, oz: 0   },
      { w: 9,  h: 4, d: 9,  color: 0xAAAAAA, y: 21,   ox: 0, oz: 0   },
      { w: 5,  h: 4, d: 5,  color: 0xCCCCCC, y: 25,   ox: 0, oz: 0   }
    ];
    var i;
    for (i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      makebox(scene, t.w, t.h, t.d, t.color, -80 + t.ox, t.y, -90 + t.oz);
    }
    // Conical peak accent for classic form
    makecone(scene, 3, 5, 8, 0xDDDDDD, -80, 29.5, -90);
  }

  function buildlochwater(scene) {
    // Large water surface boxes representing Loch Lomond expanse (0x1A5A8A)
    // The loch is long north-south; laid out as overlapping slabs at y=0
    var slabs = [
      { w: 80, h: 1, d: 60,  x:  20, z: -20  },
      { w: 70, h: 1, d: 55,  x:  10, z:  35  },
      { w: 75, h: 1, d: 50,  x:  25, z:  85  },
      { w: 60, h: 1, d: 60,  x:  15, z: 135  },
      { w: 65, h: 1, d: 55,  x:  30, z: 185  },
      { w: 55, h: 1, d: 50,  x:  20, z: 230  }
    ];
    var i;
    for (i = 0; i < slabs.length; i++) {
      var s = slabs[i];
      makebox(scene, s.w, s.h, s.d, 0x1A5A8A, s.x, 0.0, s.z);
    }
  }

  function buildislandscatter(scene) {
    // 30+ small island scatter boxes across the loch surface
    var islands = [
      {  x: 18,  z: -10,  w: 4, d: 3 },
      {  x: 30,  z:  -5,  w: 3, d: 2 },
      {  x: 22,  z:  10,  w: 5, d: 3 },
      {  x: 10,  z:  20,  w: 3, d: 4 },
      {  x: 35,  z:  15,  w: 4, d: 3 },
      {  x: 42,  z:  -8,  w: 3, d: 2 },
      {  x: 14,  z:  40,  w: 4, d: 3 },
      {  x: 28,  z:  50,  w: 3, d: 3 },
      {  x: 45,  z:  45,  w: 5, d: 2 },
      {  x: 12,  z:  65,  w: 3, d: 4 },
      {  x: 32,  z:  70,  w: 4, d: 3 },
      {  x: 50,  z:  60,  w: 3, d: 2 },
      {  x: 20,  z:  90,  w: 5, d: 3 },
      {  x: 38,  z:  95,  w: 3, d: 4 },
      {  x:  8,  z: 105,  w: 4, d: 3 },
      {  x: 55,  z: 100,  w: 3, d: 2 },
      {  x: 25,  z: 120,  w: 4, d: 3 },
      {  x: 40,  z: 130,  w: 3, d: 3 },
      {  x: 15,  z: 145,  w: 5, d: 2 },
      {  x: 48,  z: 150,  w: 3, d: 4 },
      {  x: 22,  z: 165,  w: 4, d: 3 },
      {  x: 36,  z: 175,  w: 3, d: 2 },
      {  x:  9,  z: 180,  w: 4, d: 3 },
      {  x: 52,  z: 170,  w: 3, d: 3 },
      {  x: 18,  z: 200,  w: 5, d: 3 },
      {  x: 42,  z: 205,  w: 3, d: 2 },
      {  x: 30,  z: 218,  w: 4, d: 3 },
      {  x: 12,  z: 222,  w: 3, d: 4 },
      {  x: 58,  z: 215,  w: 4, d: 3 },
      {  x: 26,  z: 240,  w: 3, d: 3 },
      {  x: 44,  z: 245,  w: 5, d: 2 },
      {  x: 16,  z: 255,  w: 3, d: 3 }
    ];
    var i;
    for (i = 0; i < islands.length; i++) {
      var isl = islands[i];
      makebox(scene, isl.w, 1.5, isl.d, 0x3A7A2A, isl.x, 1.25, isl.z);
      // small tree/bush sphere on each island
      makesphere(scene, 0.8, 5, 4, 0x2A5A1A, isl.x, 2.8, isl.z);
    }
  }

  function buildballochcastle(scene) {
    // Balloch Castle: ruined castle on loch shore
    // Main keep body
    makebox(scene, 12, 8, 10, 0x9A8A78, -30, 4.0, 30);
    // Crenellated top row (box row of merlons)
    var m;
    for (m = 0; m < 5; m++) {
      makebox(scene, 1.5, 2, 1.5, 0x8A7A68, -27 + m * 3, 9.0, 30);
    }
    // Corner towers (cylinders)
    makecylinder(scene, 1.5, 2, 10, 8, 0x8A7A68, -36, 5.0, 25);
    makecylinder(scene, 1.5, 2, 10, 8, 0x8A7A68, -24, 5.0, 25);
    makecylinder(scene, 1.5, 2, 10, 8, 0x8A7A68, -36, 5.0, 35);
    makecylinder(scene, 1.5, 2, 10, 8, 0x8A7A68, -24, 5.0, 35);
    // Fallen wall sections (low flat boxes at angles)
    makebox(scene, 8, 1.5, 2, 0x7A6A58, -20, 0.75, 32);
    makebox(scene, 2, 1.5, 7, 0x7A6A58, -18, 0.75, 37);
    makebox(scene, 6, 1.0, 2, 0x7A6A58, -32, 0.5, 40);
    // Rubble scatter
    makebox(scene, 2, 1, 2, 0x9A9A88, -28, 0.5, 28);
    makebox(scene, 1.5, 0.8, 1.5, 0x9A9A88, -22, 0.4, 33);
    makebox(scene, 1, 0.6, 1, 0x9A9A88, -25, 0.3, 36);
  }

  function buildinchmurrinisland(scene) {
    // Inchmurrin: long forested island box (20x3x8, 0x3A5A2A)
    makebox(scene, 20, 3, 8, 0x3A5A2A, 40, 1.5, 60);
    // Tree cluster spheres along the island
    makesphere(scene, 2.5, 6, 5, 0x2A4A1A, 34, 4.5, 60);
    makesphere(scene, 2.0, 6, 5, 0x2A4A1A, 38, 4.2, 58);
    makesphere(scene, 2.2, 6, 5, 0x2A4A1A, 42, 4.5, 62);
    makesphere(scene, 2.4, 6, 5, 0x2A4A1A, 46, 4.3, 60);
    makesphere(scene, 1.8, 6, 5, 0x2A4A1A, 50, 4.0, 59);
    // Small cottage on island
    makebox(scene, 3, 2, 3, 0xD4C0A0, 40, 4.0, 60);
    makecone(scene, 2.2, 1.5, 4, 0x7A4A2A, 40, 5.75, 60);
  }

  function buildlussvillage(scene) {
    // Luss village: 6 stone cottages (0xD4A97A) in a flower-garden row
    var i;
    for (i = 0; i < 6; i++) {
      var cx = -50 + i * 9;
      var cz = 10;
      // Cottage body
      makebox(scene, 5, 4, 5, 0xD4A97A, cx, 2.0, cz);
      // Pitched roof (cone)
      makecone(scene, 3.8, 2.5, 4, 0x5A3A2A, cx, 5.25, cz);
      // Chimney
      makebox(scene, 0.7, 1.5, 0.7, 0xAA8A6A, cx + 1.5, 6.5, cz);
      // Door
      makebox(scene, 1, 1.8, 0.3, 0x4A2A10, cx, 0.9, cz - 2.6);
      // Window left
      makebox(scene, 1, 0.8, 0.2, 0xAABBCC, cx - 1.5, 2.2, cz - 2.6);
      // Window right
      makebox(scene, 1, 0.8, 0.2, 0xAABBCC, cx + 1.5, 2.2, cz - 2.6);
      // Garden patch (flat coloured box in front of cottage)
      makebox(scene, 4, 0.2, 3, 0x4A7A2A, cx, 0.1, cz - 5);
      // Flower clumps (small spheres)
      makesphere(scene, 0.5, 4, 3, 0xEE4466, cx - 1.2, 0.5, cz - 5.5);
      makesphere(scene, 0.5, 4, 3, 0xFFBB22, cx,      0.5, cz - 5.5);
      makesphere(scene, 0.5, 4, 3, 0xCC44AA, cx + 1.2, 0.5, cz - 5.5);
    }
    // Village road (long flat box)
    makebox(scene, 60, 0.2, 3, 0xAA9A88, -14, 0.1, 10);
    // Stone wall along road edge
    makebox(scene, 60, 1.2, 0.6, 0x887A6A, -14, 0.6, 7.5);
  }

  function buildhighlandboundaryfault(scene) {
    // Highland Boundary Fault: long cliff wall box (0x4A4A4A)
    // Runs roughly SW-NE; represented as a long angled wall
    // Main fault scarp wall
    makebox(scene, 180, 10, 4, 0x4A4A4A, -10, 5.0, -55);
    // Secondary fault block offset
    makebox(scene, 60, 7, 3, 0x5A5A5A, 80, 3.5, -50);
    // Fault rubble toe (low broken boxes at base)
    var j;
    for (j = 0; j < 10; j++) {
      makebox(scene, 5 + j * 0.5, 1 + j * 0.1, 3, 0x3A3A3A,
        -80 + j * 18, 0.5, -52);
    }
    // Exposed rock face features (darker inset boxes)
    makebox(scene, 20, 6, 1, 0x3A3A3A, -40, 4.0, -53);
    makebox(scene, 15, 5, 1, 0x333333, 10, 3.5, -53);
    makebox(scene, 18, 7, 1, 0x3A3A3A, 55, 4.5, -53);
  }

  function buildambienttrees(scene) {
    // Scattered Highland trees around loch margins
    var treedata = [
      { x: -60, z: 20  },
      { x: -55, z: 45  },
      { x: -65, z: 70  },
      { x: -58, z: 100 },
      { x: -62, z: 130 },
      { x:  70, z:  10 },
      { x:  75, z:  40 },
      { x:  68, z:  80 },
      { x:  72, z: 110 },
      { x: -45, z: -20 },
      { x: -50, z: -40 },
      { x: -40, z: -60 }
    ];
    var i;
    for (i = 0; i < treedata.length; i++) {
      var tx = treedata[i].x;
      var tz = treedata[i].z;
      // trunk
      makecylinder(scene, 0.4, 0.6, 4, 6, 0x5A3A1A, tx, 2.0, tz);
      // canopy
      makesphere(scene, 2.2, 6, 5, 0x2A6A2A, tx, 5.5, tz);
    }
  }

  function buildgroundterrain(scene) {
    // Ground base planes as large flat boxes at y=-0.5
    makebox(scene, 250, 1, 300, 0x4A5A38, 0, -0.5, 80);
    // Highland plateau behind fault
    makebox(scene, 200, 2, 120, 0x3A4A2A, 0, 1.0, -110);
    // Lowland apron south of fault
    makebox(scene, 200, 1, 60, 0x5A6A48, 0, -0.5, -20);
  }

  function build(scene) {
    buildgroundterrain(scene);
    buildlochwater(scene);
    buildislandscatter(scene);
    buildbenlomondmountain(scene);
    buildballochcastle(scene);
    buildinchmurrinisland(scene);
    buildlussvillage(scene);
    buildhighlandboundaryfault(scene);
    buildambienttrees(scene);
  }

  return {
    build: build
  };

}());
