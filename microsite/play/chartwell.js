window.Chartwell = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 16880;
  var OFFSET_Z = 0;

  function makeMesh(geometry, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, mat);
    return mesh;
  }

  function place(mesh, x, y, z) {
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildHouse() {
    // Main house body
    var body = makeMesh(new THREE.BoxGeometry(24, 14, 14), 0xCC5500);
    place(body, 0, 7, 0);

    // Gabled dormer windows on roof - 3 dormers
    var dormer1 = makeMesh(new THREE.BoxGeometry(4, 5, 2), 0xCC5500);
    place(dormer1, -8, 17, -6);

    var dormer2 = makeMesh(new THREE.BoxGeometry(4, 5, 2), 0xCC5500);
    place(dormer2, 0, 17, -6);

    var dormer3 = makeMesh(new THREE.BoxGeometry(4, 5, 2), 0xCC5500);
    place(dormer3, 8, 17, -6);

    // Chimney stacks - 4 tall cylinders
    var chimney1 = makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 8, 6), 0xBB4400);
    place(chimney1, -10, 20, -4);

    var chimney2 = makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 8, 6), 0xBB4400);
    place(chimney2, -7, 20, -4);

    var chimney3 = makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 8, 6), 0xBB4400);
    place(chimney3, 7, 20, -4);

    var chimney4 = makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 8, 6), 0xBB4400);
    place(chimney4, 10, 20, -4);

    // Sash windows - 10 windows with glass + white frame
    var windowPositions = [
      [-9, 9, -7], [-5, 9, -7], [-1, 9, -7], [3, 9, -7], [7, 9, -7],
      [-9, 4, -7], [-5, 4, -7], [-1, 4, -7], [3, 4, -7], [7, 4, -7]
    ];
    var i;
    for (i = 0; i < windowPositions.length; i++) {
      var wp = windowPositions[i];
      var glass = makeMesh(new THREE.BoxGeometry(2, 3, 0.3), 0x87CEEB);
      place(glass, wp[0], wp[1], wp[2]);

      var frame = makeMesh(new THREE.BoxGeometry(2.4, 3.4, 0.2), 0xFFFFFF);
      place(frame, wp[0], wp[1], wp[2] - 0.05);
    }
  }

  function buildBrickWall() {
    // Main wall body - 90ft hand-laid brick wall
    var wall = makeMesh(new THREE.BoxGeometry(1.5, 4, 50), 0xCC5500);
    place(wall, 20, 2, 0);

    // Mortar courses every 2 units up wall - implied by thin horizontal bands
    var mortarY = [1, 3];
    var j;
    for (j = 0; j < mortarY.length; j++) {
      var mortar = makeMesh(new THREE.BoxGeometry(1.5, 0.2, 50), 0xDDD0B8);
      place(mortar, 20, mortarY[j], 0);
    }

    // 3 garden gate openings - dark inset panels
    var gateZ = [-15, 0, 15];
    var k;
    for (k = 0; k < gateZ.length; k++) {
      var gate = makeMesh(new THREE.BoxGeometry(0.3, 4, 2), 0x1A0A00);
      place(gate, 20.7, 2, gateZ[k]);
    }
  }

  function buildGoldfishPond() {
    // Water surface
    var water = makeMesh(new THREE.CylinderGeometry(8, 8, 1, 12), 0x2B7DBF);
    place(water, -20, 0.5, 20);

    // Brick edging around pond
    var edging = makeMesh(new THREE.CylinderGeometry(8.5, 8.5, 1.2, 12), 0xCC5500);
    place(edging, -20, 0.4, 20);

    // Water lilies - 6 lily pads + flowers
    var lilyAngles = [0, 60, 120, 180, 240, 300];
    var m;
    for (m = 0; m < lilyAngles.length; m++) {
      var angle = lilyAngles[m] * Math.PI / 180;
      var lx = -20 + Math.cos(angle) * 5;
      var lz = 20 + Math.sin(angle) * 5;

      var pad = makeMesh(new THREE.SphereGeometry(1.5, 8, 8), 0x1A8A1A);
      pad.position.set(OFFSET_X + lx, 1.1, OFFSET_Z + lz);
      scene.add(pad);
      objects.push(pad);

      var flower = makeMesh(new THREE.SphereGeometry(0.8, 8, 8), 0xFFE4B5);
      flower.position.set(OFFSET_X + lx, 1.7, OFFSET_Z + lz);
      scene.add(flower);
      objects.push(flower);
    }
  }

  function buildStudio() {
    // Studio building - cream painted
    var studio = makeMesh(new THREE.BoxGeometry(10, 8, 8), 0xF5DEB3);
    place(studio, -35, 4, 0);

    // North-light window on north wall
    var northWindow = makeMesh(new THREE.BoxGeometry(6, 5, 0.3), 0x87CEEB);
    place(northWindow, -35, 5.5, -4.15);

    // Easel - 3 sticks in tripod formation
    var easelLeg1 = makeMesh(new THREE.BoxGeometry(0.3, 6, 0.3), 0x4A2C0A);
    easelLeg1.position.set(OFFSET_X + -35, 3, OFFSET_Z + 1);
    easelLeg1.rotation.z = 0.2;
    scene.add(easelLeg1);
    objects.push(easelLeg1);

    var easelLeg2 = makeMesh(new THREE.BoxGeometry(0.3, 6, 0.3), 0x4A2C0A);
    easelLeg2.position.set(OFFSET_X + -34, 3, OFFSET_Z + 1);
    easelLeg2.rotation.z = -0.2;
    scene.add(easelLeg2);
    objects.push(easelLeg2);

    var easelLeg3 = makeMesh(new THREE.BoxGeometry(0.3, 6, 0.3), 0x4A2C0A);
    easelLeg3.position.set(OFFSET_X + -35, 3, OFFSET_Z + 2);
    easelLeg3.rotation.x = 0.3;
    scene.add(easelLeg3);
    objects.push(easelLeg3);

    // Painting canvas on easel
    var canvas = makeMesh(new THREE.BoxGeometry(4, 5, 0.2), 0xF5F5DC);
    place(canvas, -34.5, 5.5, 1.2);
  }

  function buildKitchenGarden() {
    // 4 brick walls enclosing the kitchen garden
    var kgOffX = 40;
    var kgOffZ = -30;

    // North wall
    var wallN = makeMesh(new THREE.BoxGeometry(25, 6, 2), 0xCC5500);
    place(wallN, kgOffX, 3, kgOffZ - 11.5);

    // South wall
    var wallS = makeMesh(new THREE.BoxGeometry(25, 6, 2), 0xCC5500);
    place(wallS, kgOffX, 3, kgOffZ + 11.5);

    // West wall
    var wallW = makeMesh(new THREE.BoxGeometry(2, 6, 25), 0xCC5500);
    place(wallW, kgOffX - 11.5, 3, kgOffZ);

    // East wall
    var wallE = makeMesh(new THREE.BoxGeometry(2, 6, 25), 0xCC5500);
    place(wallE, kgOffX + 11.5, 3, kgOffZ);

    // 6 raised vegetable beds
    var bedPositions = [
      [kgOffX - 6, kgOffZ - 7],
      [kgOffX, kgOffZ - 7],
      [kgOffX + 6, kgOffZ - 7],
      [kgOffX - 6, kgOffZ + 7],
      [kgOffX, kgOffZ + 7],
      [kgOffX + 6, kgOffZ + 7]
    ];
    var n;
    for (n = 0; n < bedPositions.length; n++) {
      var bed = makeMesh(new THREE.BoxGeometry(4, 1, 10), 0x5A3010);
      place(bed, bedPositions[n][0], 0.5, bedPositions[n][1]);
    }

    // 3 cold frames with glass lids
    var framePositions = [
      [kgOffX - 6, kgOffZ],
      [kgOffX, kgOffZ],
      [kgOffX + 6, kgOffZ]
    ];
    var p;
    for (p = 0; p < framePositions.length; p++) {
      var coldFrame = makeMesh(new THREE.BoxGeometry(8, 2, 4), 0x87CEEB);
      place(coldFrame, framePositions[p][0], 1.5, framePositions[p][1]);
    }

    // Apple espalier wires - 8 BoxGeometry wire shapes on wall
    var q;
    for (q = 0; q < 8; q++) {
      var wire = makeMesh(new THREE.BoxGeometry(0.5, 8, 0.5), 0x5A5A5A);
      place(wire, kgOffX - 9 + q * 2.5, 4, kgOffZ - 10);
    }
  }

  function buildMapleGarden() {
    // 8 Japanese maple trees
    var mgOffX = -15;
    var mgOffZ = 40;

    var maplePositions = [
      [-10, -10], [0, -10], [10, -10], [-15, 0],
      [15, 0], [-10, 10], [0, 10], [10, 10]
    ];
    var r;
    for (r = 0; r < maplePositions.length; r++) {
      var mx = mgOffX + maplePositions[r][0];
      var mz = mgOffZ + maplePositions[r][1];

      var trunk = makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 8), 0x4A2C0A);
      place(trunk, mx, 4, mz);

      var canopy = makeMesh(new THREE.SphereGeometry(5, 10, 10), 0xFF4500);
      place(canopy, mx, 10, mz);
    }

    // 3 bench seats
    var benchPositions = [
      [mgOffX - 12, mgOffZ + 5],
      [mgOffX, mgOffZ + 12],
      [mgOffX + 12, mgOffZ + 5]
    ];
    var s;
    for (s = 0; s < benchPositions.length; s++) {
      var bench = makeMesh(new THREE.BoxGeometry(3, 1, 1), 0x8B6914);
      place(bench, benchPositions[s][0], 0.5, benchPositions[s][1]);
    }

    // Lawn
    var lawn = makeMesh(new THREE.BoxGeometry(30, 0.5, 25), 0x4A9A4A);
    place(lawn, mgOffX, 0, mgOffZ);
  }

  function buildMapRoomView() {
    // 4 landscape panorama panels looking toward Weald
    var panelPositions = [
      [-30, 0], [-10, 0], [10, 0], [30, 0]
    ];
    var t;
    for (t = 0; t < panelPositions.length; t++) {
      var panel = makeMesh(new THREE.BoxGeometry(20, 0.3, 15), 0x4A8A4A);
      place(panel, panelPositions[t][0], 0, -60 + panelPositions[t][1]);
    }

    // Farm buildings in valley - 3 buildings
    var farmColors = [0xCC5500, 0xF5DEB3, 0xCC5500];
    var farmPositions = [
      [-20, -80], [0, -80], [20, -80]
    ];
    var u;
    for (u = 0; u < farmPositions.length; u++) {
      var farmBuilding = makeMesh(new THREE.BoxGeometry(8, 6, 6), farmColors[u]);
      place(farmBuilding, farmPositions[u][0], 3, farmPositions[u][1]);
    }
  }

  function buildMemorialGarden() {
    var mgX = 50;
    var mgZ = 40;

    // Garden base
    var gardenBase = makeMesh(new THREE.BoxGeometry(15, 0.5, 15), 0x3A8A3A);
    place(gardenBase, mgX, 0, mgZ);

    // Central cross - vertical beam
    var crossV = makeMesh(new THREE.BoxGeometry(0.8, 12, 0.8), 0xD4C5A9);
    place(crossV, mgX, 6, mgZ);

    // Central cross - horizontal beam
    var crossH = makeMesh(new THREE.BoxGeometry(8, 0.8, 0.8), 0xD4C5A9);
    place(crossH, mgX, 8, mgZ);

    // Rose bushes - 10 spheres alternating crimson and orange
    var roseColors = [
      0xFF1493, 0xFF6600, 0xFF1493, 0xFF6600, 0xFF1493,
      0xFF6600, 0xFF1493, 0xFF6600, 0xFF1493, 0xFF6600
    ];
    var roseAngles = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
    var v;
    for (v = 0; v < roseAngles.length; v++) {
      var ra = roseAngles[v] * Math.PI / 180;
      var rx = mgX + Math.cos(ra) * 6;
      var rz = mgZ + Math.sin(ra) * 6;

      var rose = makeMesh(new THREE.SphereGeometry(1.8, 8, 8), roseColors[v]);
      rose.position.set(OFFSET_X + rx, 1.5, OFFSET_Z + rz);
      scene.add(rose);
      objects.push(rose);
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
  }

  function build() {
    buildHouse();
    buildBrickWall();
    buildGoldfishPond();
    buildStudio();
    buildKitchenGarden();
    buildMapleGarden();
    buildMapRoomView();
    buildMemorialGarden();
  }

  function update(delta) {
    // No animated elements in this static environment module
    void delta;
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        objects[i].material.dispose();
      }
    }
    objects = [];
  }

  return {
    init: init,
    build: build,
    update: update,
    reset: reset
  };

}());
