window.GallowayKeep = (function() {
  'use strict';

  var WORLD_X = 2350;
  var WORLD_Z = 2200;

  function makeMaterial(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMaterial(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function makeCylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = makeMaterial(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function makeSphere(r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = makeMaterial(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function buildMerrickPeak(scene) {
    var ox = WORLD_X - 60;
    var oz = WORLD_Z - 80;
    var rockColor = 0x5A5A5A;
    var snowColor = 0xEEEEFF;

    // Base tier
    var tier1 = makeBox(30, 6, 30, rockColor, ox, 3, oz);
    scene.add(tier1);

    // Second tier
    var tier2 = makeBox(22, 5, 22, rockColor, ox, 8.5, oz);
    scene.add(tier2);

    // Third tier
    var tier3 = makeBox(16, 4, 16, rockColor, ox, 13, oz);
    scene.add(tier3);

    // Fourth tier
    var tier4 = makeBox(11, 4, 11, rockColor, ox, 17, oz);
    scene.add(tier4);

    // Summit tier
    var tier5 = makeBox(7, 3, 7, rockColor, ox, 21, oz);
    scene.add(tier5);

    // Snow cap on summit
    var snow1 = makeBox(7, 1, 7, snowColor, ox, 23, oz);
    scene.add(snow1);

    // Snow spire top
    var snow2 = makeBox(4, 2, 4, snowColor, ox, 24.5, oz);
    scene.add(snow2);
  }

  function buildClatteringshawsLoch(scene) {
    var ox = WORLD_X + 20;
    var oz = WORLD_Z + 30;
    var waterColor = 0x0A2A4A;
    var damColor = 0x9E9E9E;

    // Main loch water surface boxes
    var loch1 = makeBox(60, 1, 40, waterColor, ox, 0, oz);
    scene.add(loch1);

    var loch2 = makeBox(30, 1, 20, waterColor, ox + 30, 0, oz - 15);
    scene.add(loch2);

    var loch3 = makeBox(20, 1, 15, waterColor, ox - 30, 0, oz + 10);
    scene.add(loch3);

    // Dam wall — concrete grey box
    var dam = makeBox(40, 8, 4, damColor, ox + 10, 4, oz + 22);
    scene.add(dam);

    // Dam buttress boxes
    var butt1 = makeBox(4, 8, 6, damColor, ox - 6, 4, oz + 24);
    scene.add(butt1);

    var butt2 = makeBox(4, 8, 6, damColor, ox + 6, 4, oz + 24);
    scene.add(butt2);

    var butt3 = makeBox(4, 8, 6, damColor, ox + 18, 4, oz + 24);
    scene.add(butt3);
  }

  function buildBrucesStone(scene) {
    // On shore of loch — commemorative boulder
    var ox = WORLD_X - 10;
    var oz = WORLD_Z + 35;
    var boulderColor = 0x7A6A5A;

    var boulder = makeBox(5, 3, 4, boulderColor, ox, 1.5, oz);
    scene.add(boulder);

    // Small plinth beneath
    var plinth = makeBox(6, 0.5, 5, 0x6A5A4A, ox, 0.25, oz);
    scene.add(plinth);

    // Smaller rocks around it
    var rock1 = makeBox(1.5, 1, 1.2, boulderColor, ox + 4, 0.5, oz + 2);
    scene.add(rock1);

    var rock2 = makeBox(1.2, 0.8, 1, boulderColor, ox - 4, 0.4, oz + 1);
    scene.add(rock2);
  }

  function buildFireLookoutTower(scene) {
    var ox = WORLD_X + 80;
    var oz = WORLD_Z - 40;

    // Thin cylinder tower shaft
    var shaft = makeCylinder(0.8, 0.9, 18, 8, 0x8B6A3A, ox, 9, oz);
    scene.add(shaft);

    // Cross-brace boxes halfway up
    var brace1 = makeBox(4, 0.3, 0.3, 0x7A5A2A, ox, 7, oz);
    scene.add(brace1);

    var brace2 = makeBox(0.3, 0.3, 4, 0x7A5A2A, ox, 7, oz);
    scene.add(brace2);

    // Observation platform box on top
    var platform = makeBox(5, 1, 5, 0x6A5A4A, ox, 18.5, oz);
    scene.add(platform);

    // Cabin on platform
    var cabin = makeBox(3.5, 2.5, 3.5, 0x8B7B5B, ox, 20.75, oz);
    scene.add(cabin);

    // Roof cone
    var roof = new THREE.ConeGeometry(3, 2, 4);
    var roofMat = makeMaterial(0x4A3A2A);
    var roofMesh = new THREE.Mesh(roof, roofMat);
    roofMesh.position.set(ox, 23, oz);
    scene.add(roofMesh);

    // Ladder rungs — small boxes up the side
    var i;
    for (i = 0; i < 9; i++) {
      var rung = makeBox(0.8, 0.1, 0.1, 0x5A4A3A, ox + 0.9, 2 + i * 2, oz);
      scene.add(rung);
    }
  }

  function buildObservatory(scene) {
    var ox = WORLD_X - 30;
    var oz = WORLD_Z - 60;
    var hillColor = 0x4A6A3A;
    var wallColor = 0x3A3A5A;
    var domeColor = 0x2A2A4A;

    // Hilltop mound
    var hill = makeBox(20, 3, 20, hillColor, ox, 1.5, oz);
    scene.add(hill);

    // Cylindrical base building walls (approximated as cylinder)
    var base = makeCylinder(5, 5.5, 4, 12, wallColor, ox, 5, oz);
    scene.add(base);

    // Dome — sphere on top
    var dome = makeSphere(5, 12, 8, domeColor, ox, 9, oz);
    scene.add(dome);

    // Slit opening in dome (dark box)
    var slit = makeBox(1, 4, 0.5, 0x111122, ox, 9, oz - 4.8);
    scene.add(slit);

    // Entry porch
    var porch = makeBox(4, 3, 3, wallColor, ox, 4.5, oz + 6);
    scene.add(porch);

    // Steps leading up
    var step1 = makeBox(3, 0.5, 1.2, 0x5A5A6A, ox, 3.25, oz + 9);
    scene.add(step1);

    var step2 = makeBox(3, 0.5, 1.2, 0x5A5A6A, ox, 3.75, oz + 7.8);
    scene.add(step2);

    // Antenna mast on dome
    var mast = makeCylinder(0.1, 0.1, 3, 4, 0x888899, ox, 13.5, oz);
    scene.add(mast);
  }

  function buildAncientHillfort(scene) {
    var ox = WORLD_X + 30;
    var oz = WORLD_Z - 120;
    var earthColor = 0x5A7A3A;
    var stoneColor = 0x7A7A6A;
    var thatchColor = 0xA08030;

    // Summit plateau
    var plateau = makeBox(50, 2, 50, 0x4A6A2A, ox, 1, oz);
    scene.add(plateau);

    // Earth rampart ring — 8 rampart boxes arranged in a ring
    var ramparts = [
      [ox,        1, oz - 22],
      [ox,        1, oz + 22],
      [ox - 22,   1, oz     ],
      [ox + 22,   1, oz     ],
      [ox - 16,   1, oz - 16],
      [ox + 16,   1, oz - 16],
      [ox - 16,   1, oz + 16],
      [ox + 16,   1, oz + 16]
    ];

    var ri;
    for (ri = 0; ri < ramparts.length; ri++) {
      var rx = ramparts[ri][0];
      var ry = ramparts[ri][1];
      var rz = ramparts[ri][2];
      var isCorner = (ri >= 4);
      var rw = isCorner ? 10 : 14;
      var rd = isCorner ? 10 : 4;
      var rh = 4;
      var rampart = makeBox(rw, rh, rd, earthColor, rx, ry + rh / 2, rz);
      scene.add(rampart);
    }

    // Entrance gap (no rampart at entrance — north side left open)

    // Internal roundhouse — large circular approximation using cylinder
    var roundhouseWall = makeCylinder(5, 5.2, 3, 10, stoneColor, ox, 3.5, oz);
    scene.add(roundhouseWall);

    // Roundhouse roof (cone)
    var roundhouseRoof = new THREE.ConeGeometry(5.5, 4, 10);
    var roofMat = makeMaterial(thatchColor);
    var roofMesh = new THREE.Mesh(roundhouseRoof, roofMat);
    roofMesh.position.set(ox, 7, oz);
    scene.add(roofMesh);

    // Smaller secondary roundhouse
    var roundhouse2 = makeCylinder(3, 3.1, 2.5, 8, stoneColor, ox + 12, 3.25, oz + 8);
    scene.add(roundhouse2);

    var roof2geo = new THREE.ConeGeometry(3.5, 3, 8);
    var roof2mat = makeMaterial(thatchColor);
    var roof2mesh = new THREE.Mesh(roof2geo, roof2mat);
    roof2mesh.position.set(ox + 12, 6.25, oz + 8);
    scene.add(roof2mesh);

    // Standing stones inside fort
    var stones = [
      [ox - 8, oz + 5],
      [ox - 10, oz - 3],
      [ox + 8, oz - 8]
    ];

    var si;
    for (si = 0; si < stones.length; si++) {
      var sx = stones[si][0];
      var sz = stones[si][1];
      var stone = makeBox(0.6, 3, 0.6, stoneColor, sx, 3.5, sz);
      scene.add(stone);
    }

    // Ditch outside ramparts — dark boxes
    var ditchColor = 0x2A3A1A;
    var ditchData = [
      [ox,       oz - 26, 50, 1.5, 3],
      [ox,       oz + 26, 50, 1.5, 3],
      [ox - 26,  oz,      3,  1.5, 50],
      [ox + 26,  oz,      3,  1.5, 50]
    ];

    var di;
    for (di = 0; di < ditchData.length; di++) {
      var dx = ditchData[di][0];
      var dz = ditchData[di][1];
      var dw = ditchData[di][2];
      var dh = ditchData[di][3];
      var dd = ditchData[di][4];
      var ditch = makeBox(dw, dh, dd, ditchColor, dx, 0.25, dz);
      scene.add(ditch);
    }
  }

  function buildForestPines(scene) {
    // Scattered dark pine trees using stacked cones and cylinders
    var pinePositions = [
      [WORLD_X - 90, WORLD_Z + 10],
      [WORLD_X - 100, WORLD_Z - 20],
      [WORLD_X - 85, WORLD_Z + 40],
      [WORLD_X + 100, WORLD_Z + 60],
      [WORLD_X + 110, WORLD_Z + 30],
      [WORLD_X - 120, WORLD_Z + 80],
      [WORLD_X + 60, WORLD_Z + 100],
      [WORLD_X + 70, WORLD_Z + 80],
      [WORLD_X - 50, WORLD_Z + 90],
      [WORLD_X - 40, WORLD_Z + 70]
    ];

    var pi;
    for (pi = 0; pi < pinePositions.length; pi++) {
      var px = pinePositions[pi][0];
      var pz = pinePositions[pi][1];

      // Trunk
      var trunk = makeCylinder(0.3, 0.4, 4, 6, 0x5C3A1E, px, 2, pz);
      scene.add(trunk);

      // Lower canopy
      var cone1 = new THREE.ConeGeometry(3, 4, 6);
      var cone1mat = makeMaterial(0x1A4A2A);
      var cone1mesh = new THREE.Mesh(cone1, cone1mat);
      cone1mesh.position.set(px, 6, pz);
      scene.add(cone1mesh);

      // Middle canopy
      var cone2 = new THREE.ConeGeometry(2, 3, 6);
      var cone2mat = makeMaterial(0x1E5530);
      var cone2mesh = new THREE.Mesh(cone2, cone2mat);
      cone2mesh.position.set(px, 8.5, pz);
      scene.add(cone2mesh);

      // Top canopy
      var cone3 = new THREE.ConeGeometry(1.2, 2.5, 6);
      var cone3mat = makeMaterial(0x226635);
      var cone3mesh = new THREE.Mesh(cone3, cone3mat);
      cone3mesh.position.set(px, 10.75, pz);
      scene.add(cone3mesh);
    }
  }

  function buildGroundTerrain(scene) {
    // Rolling moorland ground boxes
    var moorColor = 0x3D5C2A;
    var bogColor = 0x2A4A1A;

    // Base ground plane approximated with large flat boxes
    var ground1 = makeBox(300, 1, 300, moorColor, WORLD_X, -0.5, WORLD_Z);
    scene.add(ground1);

    // Raised moorland ridges
    var ridge1 = makeBox(80, 2, 20, moorColor, WORLD_X - 40, 0.5, WORLD_Z + 50);
    scene.add(ridge1);

    var ridge2 = makeBox(40, 3, 60, 0x4A6A30, WORLD_X + 50, 1, WORLD_Z - 30);
    scene.add(ridge2);

    // Bog patches — darker flat boxes
    var bog1 = makeBox(30, 0.6, 20, bogColor, WORLD_X + 10, 0.3, WORLD_Z + 70);
    scene.add(bog1);

    var bog2 = makeBox(20, 0.6, 15, bogColor, WORLD_X - 70, 0.3, WORLD_Z + 20);
    scene.add(bog2);

    // Heather patches — purple-ish
    var heatherColor = 0x6A3A7A;
    var heather1 = makeBox(25, 0.8, 18, heatherColor, WORLD_X - 20, 0.4, WORLD_Z + 55);
    scene.add(heather1);

    var heather2 = makeBox(15, 0.8, 12, heatherColor, WORLD_X + 40, 0.4, WORLD_Z + 45);
    scene.add(heather2);
  }

  function buildRockyOutcrops(scene) {
    // Scattered granite boulders and outcrops typical of Galloway Hills
    var graniteColor = 0x6A6A6A;
    var darkGranite = 0x4A4A4A;

    var outcrops = [
      [WORLD_X - 45, WORLD_Z - 30, 5, 3, 4],
      [WORLD_X - 47, WORLD_Z - 28, 3, 2, 2.5],
      [WORLD_X + 35, WORLD_Z + 15, 6, 4, 5],
      [WORLD_X + 37, WORLD_Z + 18, 3, 2.5, 3],
      [WORLD_X - 15, WORLD_Z - 50, 4, 3, 3],
      [WORLD_X + 55, WORLD_Z - 55, 7, 5, 6],
      [WORLD_X + 58, WORLD_Z - 52, 3, 3, 3]
    ];

    var oi;
    for (oi = 0; oi < outcrops.length; oi++) {
      var ox2 = outcrops[oi][0];
      var oz2 = outcrops[oi][1];
      var ow = outcrops[oi][2];
      var oh = outcrops[oi][3];
      var od = outcrops[oi][4];
      var col = (oi % 2 === 0) ? graniteColor : darkGranite;
      var outcrop = makeBox(ow, oh, od, col, ox2, oh / 2, oz2);
      scene.add(outcrop);
    }
  }

  function buildDarkSkyMarkers(scene) {
    // Signpost / marker posts for dark sky area boundary
    var postColor = 0x8B6A3A;

    var posts = [
      [WORLD_X + 120, WORLD_Z + 120],
      [WORLD_X - 120, WORLD_Z + 120],
      [WORLD_X + 120, WORLD_Z - 120],
      [WORLD_X - 120, WORLD_Z - 120]
    ];

    var mi;
    for (mi = 0; mi < posts.length; mi++) {
      var mx = posts[mi][0];
      var mz = posts[mi][1];

      // Post
      var post = makeCylinder(0.15, 0.15, 3, 4, postColor, mx, 1.5, mz);
      scene.add(post);

      // Sign board
      var sign = makeBox(1.5, 0.8, 0.1, 0x2A2A2A, mx, 3.2, mz);
      scene.add(sign);
    }
  }

  function build(scene) {
    buildGroundTerrain(scene);
    buildMerrickPeak(scene);
    buildClatteringshawsLoch(scene);
    buildBrucesStone(scene);
    buildFireLookoutTower(scene);
    buildObservatory(scene);
    buildAncientHillfort(scene);
    buildForestPines(scene);
    buildRockyOutcrops(scene);
    buildDarkSkyMarkers(scene);
  }

  return {
    build: build,
    WORLD_X: WORLD_X,
    WORLD_Z: WORLD_Z
  };
}());
