window.FolkestoneTunnel = (function() {
  'use strict';

  var OX = 4360;
  var OZ = 2200;
  var scene;
  var objects = [];

  function addmesh(geo, mat, x, y, z, rx, ry, rz) {
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function matl(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function box(w, h, d) {
    return new THREE.BoxGeometry(w, h, d);
  }

  function cyl(rt, rb, h, segs) {
    return new THREE.CylinderGeometry(rt, rb, h, segs || 8);
  }

  function buildterminal() {
    var grey = matl(0x808080);
    var white = matl(0xFFFFFF);
    var dark = matl(0x333333);
    var i;
    // Main terminal buildings
    addmesh(box(80, 20, 40), grey, -40, 10, -80);
    addmesh(box(80, 20, 40), grey, 60, 10, -80);
    addmesh(box(160, 8, 20), white, 10, 4, -40);
    // Vehicle loading platforms
    for (i = 0; i < 6; i++) {
      addmesh(box(60, 2, 8), grey, -60 + i * 20, 1, -20);
    }
    // Overhead gantries
    addmesh(box(140, 2, 2), dark, 10, 18, -60);
    addmesh(box(140, 2, 2), dark, 10, 18, -70);
    addmesh(box(2, 16, 2), dark, -60, 9, -60);
    addmesh(box(2, 16, 2), dark, 80, 9, -60);
    addmesh(box(2, 16, 2), dark, -60, 9, -70);
    addmesh(box(2, 16, 2), dark, 80, 9, -70);
    // Control tower
    addmesh(box(10, 30, 10), white, 100, 15, -80);
    addmesh(box(14, 4, 14), grey, 100, 31, -80);
  }

  function buildtunnel() {
    var chalk = matl(0xF5F5DC);
    var darkmat = matl(0x111111);
    var concrete = matl(0xAAAAAA);
    // Chalk cliff face
    addmesh(box(80, 40, 10), chalk, 0, 20, -100);
    // Two tunnel mouths side by side
    addmesh(cyl(6, 6, 4, 12), darkmat, -12, 2, -98);
    addmesh(cyl(6, 6, 4, 12), darkmat, 12, 2, -98);
    // Tunnel mouth surrounds
    addmesh(box(14, 16, 4), concrete, -12, 8, -102);
    addmesh(box(14, 16, 4), concrete, 12, 8, -102);
    // Cliff extension
    addmesh(box(80, 40, 30), chalk, 0, 20, -130);
    addmesh(box(80, 40, 30), chalk, 0, 20, -160);
  }

  function buildharbour() {
    var stone = matl(0x999988);
    var water = matl(0x1E90FF);
    var wood = matl(0x8B6914);
    var hull = matl(0x8B0000);
    var i;
    // Harbour walls
    addmesh(box(80, 6, 4), stone, 60, 3, 60);
    addmesh(box(4, 6, 60), stone, 20, 3, 90);
    addmesh(box(4, 6, 60), stone, 100, 3, 90);
    addmesh(box(80, 6, 4), stone, 60, 3, 120);
    // Water basin
    addmesh(box(76, 1, 56), water, 60, 0, 91);
    // Fishing trawlers
    for (i = 0; i < 3; i++) {
      addmesh(box(12, 3, 5), hull, 35 + i * 16, 2, 85);
      addmesh(box(12, 1, 5), wood, 35 + i * 16, 4, 85);
      addmesh(box(1, 8, 1), wood, 35 + i * 16, 8, 85);
    }
    // Harbour master building
    addmesh(box(10, 8, 10), stone, 105, 4, 65);
  }

  function buildviaduct() {
    var brick = matl(0x8B3A3A);
    var i;
    for (i = 0; i < 8; i++) {
      var bx = -80 + i * 18;
      // Left pillar
      addmesh(box(4, 20, 4), brick, bx, 10, 150);
      // Right pillar
      addmesh(box(4, 20, 4), brick, bx + 12, 10, 150);
      // Arch span
      addmesh(box(20, 4, 4), brick, bx + 6, 22, 150);
      // Spandrel infill
      addmesh(box(8, 6, 4), brick, bx + 6, 27, 150);
    }
    // Parapet
    addmesh(box(144, 2, 4), brick, 8, 32, 150);
  }

  function buildpromenade() {
    var cream = matl(0xFFF8DC);
    var grey = matl(0xAAAAAA);
    var i;
    // Clifftop path
    addmesh(box(200, 1, 6), cream, 0, 35, 200);
    // Pavilions every 10 blocks
    for (i = 0; i < 10; i++) {
      var px = -90 + i * 20;
      // Pavilion base
      addmesh(box(8, 4, 6), cream, px, 37, 200);
      // Pavilion roof
      addmesh(box(9, 1, 7), cream, px, 41, 200);
      // Pavilion pillars
      addmesh(box(1, 4, 1), cream, px - 3, 37, 200);
      addmesh(box(1, 4, 1), cream, px + 3, 37, 200);
    }
    // Cliff face below promenade
    addmesh(box(200, 35, 10), grey, 0, 17, 208);
  }

  function buildcreativequarter() {
    var colors = [
      0xFF6B6B, 0xFFD93D, 0x6BCB77, 0x4D96FF,
      0xFF922B, 0xCC5DE8, 0x20C997, 0xF06595
    ];
    var i;
    for (i = 0; i < 8; i++) {
      var cx = -30 + i * 14;
      var ch = 8 + Math.floor(i * 1.5);
      var cw = 8 + (i % 3) * 2;
      addmesh(box(cw, ch, 10), matl(colors[i]), cx, ch / 2, 250);
      // Small detail boxes on rooftops
      addmesh(box(3, 3, 3), matl(colors[(i + 3) % 8]), cx, ch + 1.5, 250);
    }
    // Gallery building
    addmesh(box(30, 12, 15), matl(0xFFFFFF), 60, 6, 255);
    addmesh(box(32, 2, 17), matl(0xCCCCCC), 60, 13, 255);
  }

  function buildcastle() {
    var sand = matl(0xD2B48C);
    var dark = matl(0xBEA07A);
    // Central tower
    addmesh(cyl(6, 6, 8, 16), sand, 160, 4, 50);
    // Battlements
    var j;
    for (j = 0; j < 8; j++) {
      var angle = (j / 8) * Math.PI * 2;
      var bx2 = Math.cos(angle) * 6;
      var bz2 = Math.sin(angle) * 6;
      addmesh(box(2, 3, 2), sand, 160 + bx2, 9.5, 50 + bz2);
    }
    // Three semicircular bastions
    addmesh(cyl(5, 5, 6, 8), dark, 148, 3, 50);
    addmesh(cyl(5, 5, 6, 8), dark, 166, 3, 38);
    addmesh(cyl(5, 5, 6, 8), dark, 166, 3, 62);
    // Connecting walls
    addmesh(box(15, 6, 3), sand, 154, 3, 50);
    addmesh(box(3, 6, 15), sand, 163, 3, 44);
    addmesh(box(3, 6, 15), sand, 163, 3, 56);
    // Courtyard
    addmesh(box(20, 1, 20), dark, 158, 0.5, 50);
  }

  function buildwarren() {
    var chalk = matl(0xEEEEDD);
    var rock = matl(0xAA9988);
    var i;
    // Main cliff face landslide
    for (i = 0; i < 20; i++) {
      var wx = -100 + i * 14;
      var wh = 5 + (i % 5) * 4;
      var wd = 8 + (i % 3) * 6;
      addmesh(box(10, wh, wd), chalk, wx, wh / 2, 300);
    }
    // Boulder piles
    for (i = 0; i < 15; i++) {
      var boulderx = -110 + i * 16;
      var boulderh = 2 + (i % 4) * 2;
      addmesh(box(6, boulderh, 6), rock, boulderx, boulderh / 2, 320);
      addmesh(box(4, boulderh - 1, 4), rock, boulderx + 4, (boulderh - 1) / 2, 316);
    }
    // Lower debris field
    for (i = 0; i < 10; i++) {
      addmesh(box(8, 3, 8), chalk, -80 + i * 18, 1.5, 340);
    }
  }

  function buildshuttletrain() {
    var silver = matl(0xC0C0C0);
    var track = matl(0x555555);
    var i;
    // Track rails
    addmesh(box(2, 1, 120), track, -6, 0.5, -40);
    addmesh(box(2, 1, 120), track, 6, 0.5, -40);
    // Sleepers
    for (i = 0; i < 20; i++) {
      addmesh(box(16, 1, 2), track, 0, 0.3, -95 + i * 6);
    }
    // Train carriages
    for (i = 0; i < 8; i++) {
      addmesh(box(14, 5, 14), silver, 0, 3.5, -80 + i * 16);
      // Carriage windows
      addmesh(box(12, 2, 1), matl(0x88AACC), 0, 4, -73 + i * 16);
    }
    // Locomotive
    addmesh(box(14, 7, 16), matl(0xFF6600), 0, 4.5, 44);
    addmesh(box(6, 3, 6), matl(0x333333), 0, 9.5, 44);
  }

  function buildchannel() {
    var seawater = matl(0x4682B4);
    var france = matl(0xCCCCCC);
    // English Channel water
    addmesh(box(400, 2, 200), seawater, 0, -1, 400);
    // Horizon suggestion of France
    addmesh(box(300, 20, 10), france, 0, 10, 600);
    // White cliffs suggestion
    addmesh(box(300, 30, 8), matl(0xF5F5DC), 0, 15, 610);
    // Seagulls suggestion (small white boxes)
    var k;
    for (k = 0; k < 8; k++) {
      addmesh(box(2, 0.5, 1), matl(0xFFFFFF), -80 + k * 22, 25 + (k % 3) * 5, 380);
    }
  }

  function buildground() {
    var grass = matl(0x5A8C3C);
    var tarmac = matl(0x444444);
    // Main ground
    addmesh(box(400, 2, 600), grass, 0, -1, 200);
    // Terminal tarmac area
    addmesh(box(200, 1, 120), tarmac, 0, 0, -40);
  }

  function init(sceneref) {
    scene = sceneref;
    buildground();
    buildterminal();
    buildtunnel();
    buildharbour();
    buildviaduct();
    buildpromenade();
    buildcreativequarter();
    buildcastle();
    buildwarren();
    buildshuttletrain();
    buildchannel();
  }

  function update(delta) {
    // static environment, nothing to update
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) objects[i].geometry.dispose();
      if (objects[i].material) objects[i].material.dispose();
    }
    objects = [];
  }

  return { init: init, update: update, reset: reset };
}());
