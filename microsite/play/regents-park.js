window.RegentsPark = (function() {
  'use strict';

  var OX = 4880;
  var OZ = 2200;
  var objects = [];
  var scene = null;

  function makebox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makecylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makesphere(r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildlake() {
    // Main lake body
    makebox(40, 0.5, 12, 0x4169E1, 0, 0.25, 0);
    // Island in center
    makebox(6, 0.8, 4, 0x556B2F, 0, 0.65, 0);
    // Trees on island
    makebox(1, 3, 1, 0x228B22, -1, 2.2, 0);
    makebox(1, 3, 1, 0x228B22, 1, 2.2, 0);
    // Rowing boats
    makebox(3, 0.4, 1.2, 0x8B4513, -10, 0.55, -3);
    makebox(3, 0.4, 1.2, 0x8B4513, -8, 0.55, 3);
    makebox(3, 0.4, 1.2, 0x8B4513, 12, 0.55, 2);
    makebox(3, 0.4, 1.2, 0xA0522D, -14, 0.55, -1);
    makebox(3, 0.4, 1.2, 0xA0522D, 15, 0.55, -4);
  }

  function buildtheatre() {
    var tx = -30, tz = 40;
    var i;
    // Stage
    makebox(14, 1.5, 8, 0x8B7355, tx, 0.75, tz);
    makebox(12, 4, 0.5, 0x6B5B3E, tx, 3.0, tz - 4);
    // Tiered seating rows (curved arrangement)
    for (i = 0; i < 5; i++) {
      makebox(16 + i * 2, 0.4, 2.5, 0x8B6914, tx, 1.5 + i * 0.6, tz + 8 + i * 2.5);
    }
    // Tree backdrop
    makebox(2, 7, 2, 0x228B22, tx - 8, 4.5, tz - 6);
    makebox(2, 8, 2, 0x228B22, tx - 4, 5.0, tz - 7);
    makebox(2, 7, 2, 0x228B22, tx, 4.5, tz - 8);
    makebox(2, 8, 2, 0x228B22, tx + 4, 5.0, tz - 7);
    makebox(2, 7, 2, 0x228B22, tx + 8, 4.5, tz - 6);
    // Lighting rigs (boxes)
    makebox(0.3, 0.3, 12, 0x444444, tx - 9, 6.5, tz);
    makebox(0.3, 0.3, 12, 0x444444, tx + 9, 6.5, tz);
  }

  function buildnashterraces() {
    var i;
    // North terrace facade
    makebox(60, 10, 2, 0xFFF8DC, 0, 5, -80);
    // Columns along north terrace
    for (i = 0; i < 10; i++) {
      makecylinder(0.4, 0.4, 10, 8, 0xFFFAF0, -27 + i * 6, 5, -81);
    }
    // South terrace facade
    makebox(60, 10, 2, 0xFFF8DC, 0, 5, 80);
    for (i = 0; i < 10; i++) {
      makecylinder(0.4, 0.4, 10, 8, 0xFFFAF0, -27 + i * 6, 5, 81);
    }
    // East terrace facade
    makebox(2, 10, 60, 0xFFF8DC, 80, 5, 0);
    for (i = 0; i < 10; i++) {
      makecylinder(0.4, 0.4, 10, 8, 0xFFFAF0, 81, 5, -27 + i * 6);
    }
    // West terrace facade
    makebox(2, 10, 60, 0xFFF8DC, -80, 5, 0);
    for (i = 0; i < 10; i++) {
      makecylinder(0.4, 0.4, 10, 8, 0xFFFAF0, -81, 5, -27 + i * 6);
    }
    // Pilasters (flat box projections)
    for (i = 0; i < 6; i++) {
      makebox(1.2, 10, 0.8, 0xFFF0DC, -25 + i * 10, 5, -80.5);
      makebox(1.2, 10, 0.8, 0xFFF0DC, -25 + i * 10, 5, 80.5);
    }
    // Pediment tops
    makebox(62, 2, 1, 0xFFF8DC, 0, 11, -80);
    makebox(62, 2, 1, 0xFFF8DC, 0, 11, 80);
    makebox(1, 2, 62, 0xFFF8DC, 80, 11, 0);
    makebox(1, 2, 62, 0xFFF8DC, -80, 11, 0);
  }

  function buildzoo() {
    var zx = 20, zz = -110;
    // Perimeter fence boxes
    makebox(80, 3, 1, 0x808080, zx, 1.5, zz);
    makebox(80, 3, 1, 0x808080, zx, 1.5, zz - 50);
    makebox(1, 3, 50, 0x808080, zx - 40, 1.5, zz - 25);
    makebox(1, 3, 50, 0x808080, zx + 40, 1.5, zz - 25);

    // Animal enclosures
    makebox(20, 2, 15, 0x8FBC8F, zx - 20, 1, zz - 10);
    makebox(20, 2, 15, 0xA0C878, zx + 20, 1, zz - 10);
    makebox(18, 2, 14, 0x90C070, zx - 20, 1, zz - 35);

    // Penguin Pool - modernist Box/Cylinder structure
    makebox(10, 0.5, 8, 0x87CEEB, zx + 20, 0.25, zz - 38);
    makecylinder(4, 4, 1.5, 12, 0xE0E0E0, zx + 20, 0.75, zz - 38);
    makecylinder(3, 3, 0.3, 12, 0x87CEEB, zx + 20, 1.45, zz - 38);
    makebox(0.4, 3, 8, 0xE0E0E0, zx + 16, 2, zz - 38);
    makebox(0.4, 3, 8, 0xE0E0E0, zx + 24, 2, zz - 38);

    // Snowdon Aviary - tall mesh-like box structure
    makebox(16, 14, 12, 0xC0C0C0, zx - 20, 7, zz - 42);
    // Aviary mesh effect with thin cross pieces
    makebox(16, 0.2, 0.2, 0xA0A0A0, zx - 20, 3, zz - 42);
    makebox(16, 0.2, 0.2, 0xA0A0A0, zx - 20, 7, zz - 42);
    makebox(16, 0.2, 0.2, 0xA0A0A0, zx - 20, 11, zz - 42);
    makebox(0.2, 14, 0.2, 0xA0A0A0, zx - 14, 7, zz - 42);
    makebox(0.2, 14, 0.2, 0xA0A0A0, zx - 20, 7, zz - 42);
    makebox(0.2, 14, 0.2, 0xA0A0A0, zx - 26, 7, zz - 42);

    // Giraffe enclosure with giraffe shapes
    makebox(18, 1, 14, 0xF4A460, zx + 20, 0.5, zz - 44);
    // Giraffe bodies (tall boxes)
    makebox(1.5, 8, 1.5, 0xDAA520, zx + 17, 5, zz - 44);
    makebox(0.6, 5, 0.6, 0xDAA520, zx + 17, 11.5, zz - 43);
    makebox(1.5, 8, 1.5, 0xDAA520, zx + 22, 5, zz - 46);
    makebox(0.6, 5, 0.6, 0xDAA520, zx + 22, 11.5, zz - 45);
  }

  function buildprimrosehill() {
    var px = 80, pz = -120;
    // Hill as stacked boxes, increasingly smaller toward summit
    makebox(60, 3, 60, 0x5A8A3C, px, 1.5, pz);
    makebox(48, 3, 48, 0x5A8A3C, px, 4.5, pz);
    makebox(36, 3, 36, 0x4A7A2C, px, 7.5, pz);
    makebox(24, 3, 24, 0x4A7A2C, px, 10.5, pz);
    makebox(12, 2, 12, 0x3A6A1C, px, 14, pz);
    // Summit at y=15
    makebox(6, 1, 6, 0x3A6A1C, px, 15.5, pz);
    // Viewing point structure at top
    makebox(5, 0.3, 5, 0x808080, px, 16.15, pz);
    makebox(0.2, 1.5, 5, 0x707070, px - 2.4, 16.9, pz);
    makebox(0.2, 1.5, 5, 0x707070, px + 2.4, 16.9, pz);
    makebox(5, 0.3, 0.2, 0x707070, px, 16.9, pz - 2.4);
    makebox(5, 0.3, 0.2, 0x707070, px, 16.9, pz + 2.4);
    // Information board
    makebox(2, 1.5, 0.1, 0xD2B48C, px, 17.2, pz - 3);
  }

  function buildcanal() {
    var cx = -60, cz = -90;
    // Canal water
    makebox(60, 0.5, 4, 0x4169E1, cx, 0.25, cz);
    // Canal walls
    makebox(60, 1.5, 0.5, 0x808060, cx, 0.75, cz - 2.25);
    makebox(60, 1.5, 0.5, 0x808060, cx, 0.75, cz + 2.25);
    // Narrowboats moored
    makebox(8, 1.8, 2, 0xCC2200, cx - 18, 1.15, cz - 0.5);
    makebox(0.3, 2.2, 2, 0xAA1100, cx - 14.2, 1.3, cz - 0.5);
    makebox(8, 1.8, 2, 0x006633, cx - 4, 1.15, cz + 0.5);
    makebox(0.3, 2.2, 2, 0x004422, cx + 0.1, 1.3, cz + 0.5);
    makebox(8, 1.8, 2, 0x003399, cx + 14, 1.15, cz - 0.5);
    makebox(0.3, 2.2, 2, 0x002277, cx + 18.1, 1.3, cz - 0.5);
    // Bridge over canal
    makebox(6, 1, 6, 0x909090, cx + 24, 1.5, cz);
    makebox(6, 0.4, 0.3, 0x707070, cx + 24, 2.2, cz - 2.25);
    makebox(6, 0.4, 0.3, 0x707070, cx + 24, 2.2, cz + 2.25);
  }

  function buildrosegarden() {
    var i, angle, bx, bz;
    var rx = -10, rz = 20;
    // Circular rose beds - arranged around center
    for (i = 0; i < 8; i++) {
      angle = i * Math.PI * 2 / 8;
      bx = rx + Math.cos(angle) * 14;
      bz = rz + Math.sin(angle) * 14;
      makebox(4, 0.5, 4, 0x2E8B22, bx, 0.25, bz);
      // Flower clusters
      makesphere(0.7, 6, 6, 0xCC1122, bx - 0.8, 1.1, bz - 0.8);
      makesphere(0.7, 6, 6, 0xFF69B4, bx + 0.8, 1.1, bz + 0.8);
      makesphere(0.7, 6, 6, 0xFF0000, bx, 1.1, bz);
      makesphere(0.6, 6, 6, 0xFFD700, bx + 0.8, 1.1, bz - 0.8);
    }
    // Central fountain box
    makebox(3, 0.4, 3, 0x87CEEB, rx, 0.2, rz);
    makecylinder(0.3, 0.5, 2, 8, 0xC0C0C0, rx, 1.2, rz);
    // Trellis arch over main path
    makebox(0.3, 4, 0.3, 0x8B6914, rx - 2, 2, rz - 20);
    makebox(0.3, 4, 0.3, 0x8B6914, rx + 2, 2, rz - 20);
    makebox(5, 0.3, 0.3, 0x8B6914, rx, 4.15, rz - 20);
    // Rose vines on trellis
    makebox(0.2, 3, 0.2, 0x228B22, rx - 2, 1.8, rz - 20);
    makebox(0.2, 3, 0.2, 0x228B22, rx + 2, 1.8, rz - 20);
    makesphere(0.4, 6, 6, 0xFF1493, rx - 2, 4.2, rz - 20);
    makesphere(0.4, 6, 6, 0xFF69B4, rx + 2, 4.2, rz - 20);
    // Second arch
    makebox(0.3, 4, 0.3, 0x8B6914, rx - 2, 2, rz - 25);
    makebox(0.3, 4, 0.3, 0x8B6914, rx + 2, 2, rz - 25);
    makebox(5, 0.3, 0.3, 0x8B6914, rx, 4.15, rz - 25);
  }

  function buildinnercircle() {
    var i, angle, sx, sz, len, seg, kerb;
    var cx = -10, cz = 20;
    var radius = 28;
    // Approximate circle with 16 box road segments
    for (i = 0; i < 16; i++) {
      angle = i * Math.PI * 2 / 16;
      sx = cx + Math.cos(angle) * radius;
      sz = cz + Math.sin(angle) * radius;
      len = 2 * Math.PI * radius / 16 + 1;
      seg = makebox(len, 0.3, 4, 0x606060, sx, 0.15, sz);
      seg.rotation.y = -angle;
    }
    // Kerb strips
    for (i = 0; i < 16; i++) {
      angle = i * Math.PI * 2 / 16;
      sx = cx + Math.cos(angle) * (radius + 2.5);
      sz = cz + Math.sin(angle) * (radius + 2.5);
      len = 2 * Math.PI * radius / 16 + 1;
      kerb = makebox(len, 0.5, 0.4, 0xB0B0B0, sx, 0.25, sz);
      kerb.rotation.y = -angle;
    }
  }

  function buildwinfieldhouse() {
    var wx = 60, wz = 30;
    // Main mansion body
    makebox(18, 10, 6, 0xFFF8DC, wx, 5, wz);
    // Roof
    makebox(20, 1, 8, 0xE8E0C0, wx, 10.5, wz);
    // Columns at entrance
    makecylinder(0.35, 0.35, 10, 8, 0xFFFAF0, wx - 6, 5, wz - 3.5);
    makecylinder(0.35, 0.35, 10, 8, 0xFFFAF0, wx - 2, 5, wz - 3.5);
    makecylinder(0.35, 0.35, 10, 8, 0xFFFAF0, wx + 2, 5, wz - 3.5);
    makecylinder(0.35, 0.35, 10, 8, 0xFFFAF0, wx + 6, 5, wz - 3.5);
    // Door
    makebox(2, 4, 0.2, 0x4A2C00, wx, 2, wz - 3.1);
    // Windows
    makebox(1.5, 2, 0.15, 0x87CEEB, wx - 5, 6, wz - 3.1);
    makebox(1.5, 2, 0.15, 0x87CEEB, wx - 2, 6, wz - 3.1);
    makebox(1.5, 2, 0.15, 0x87CEEB, wx + 2, 6, wz - 3.1);
    makebox(1.5, 2, 0.15, 0x87CEEB, wx + 5, 6, wz - 3.1);
    // American eagle decoration on facade (simplified box shape)
    makebox(3, 1, 0.3, 0x8B7536, wx, 9, wz - 3.0);
    makebox(2, 0.5, 0.3, 0x8B7536, wx - 2, 8.5, wz - 3.0);
    makebox(2, 0.5, 0.3, 0x8B7536, wx + 2, 8.5, wz - 3.0);
    // Eagle head
    makebox(0.8, 0.8, 0.3, 0xFFFFFF, wx, 9.7, wz - 3.0);
    // Grounds / lawn
    makebox(30, 0.2, 20, 0x3A7A1C, wx, 0.1, wz + 8);
    // Gate pillars
    makebox(1, 4, 1, 0xFFF8DC, wx - 8, 2, wz + 10);
    makebox(1, 4, 1, 0xFFF8DC, wx + 8, 2, wz + 10);
    makebox(16, 0.3, 0.3, 0x888888, wx, 4.15, wz + 10);
  }

  function buildstjohnswood() {
    var i, vx, vz, pi, ri, angle;
    // Victorian villas - scattered arrangement
    var villax = [-120, -130, -115, -140, -125];
    var villaz = [20, 40, 60, 25, 55];
    for (i = 0; i < 5; i++) {
      vx = villax[i];
      vz = villaz[i];
      // Villa body
      makebox(10, 7, 8, 0xD2B48C, vx, 3.5, vz);
      // Roof
      makebox(11, 0.5, 9, 0x8B4513, vx, 7.25, vz);
      // Ridge
      makebox(10, 3, 0.5, 0x6B3410, vx, 8.5, vz);
      // Chimney
      makebox(1.2, 4, 1.2, 0xB05040, vx + 3, 10, vz - 2);
      // Windows
      makebox(1.5, 1.5, 0.15, 0x87CEEB, vx - 2.5, 4.5, vz - 4.1);
      makebox(1.5, 1.5, 0.15, 0x87CEEB, vx + 2.5, 4.5, vz - 4.1);
      // Door
      makebox(1.5, 3, 0.15, 0x4A2C00, vx, 1.5, vz - 4.1);
      // Garden
      makebox(12, 0.15, 6, 0x3A7A1C, vx, 0.075, vz - 8);
    }

    // Lord's Cricket Ground
    var lx = -100, lz = -20;
    // Ground / pitch
    makebox(50, 0.2, 40, 0x5A9A3C, lx, 0.1, lz);
    // Pitch strip
    makebox(4, 0.25, 20, 0xC8B060, lx, 0.125, lz);
    // Main pavilion
    makebox(24, 8, 8, 0xFFFAF0, lx, 4, lz - 22);
    // Members stand roof
    makebox(26, 1, 10, 0xFFFFFF, lx, 8.5, lz - 22);
    // Stand pillars
    for (pi = 0; pi < 8; pi++) {
      makecylinder(0.25, 0.25, 8, 6, 0xFFFFFF, lx - 10.5 + pi * 3, 4, lz - 26.5);
    }
    // Scoreboard
    makebox(6, 8, 1, 0x1A1A1A, lx + 22, 4, lz - 18);
    makebox(5, 6, 0.2, 0xF0F0F0, lx + 22, 4, lz - 17.5);
    // Media centre - distinctive futuristic white pod
    makebox(14, 10, 8, 0xFFFFFF, lx - 18, 5, lz - 22);
    // Boundary rope posts
    for (ri = 0; ri < 8; ri++) {
      angle = ri * Math.PI * 2 / 8;
      makebox(0.2, 0.8, 0.2, 0xFFFFFF, lx + Math.cos(angle) * 22, 0.4, lz + Math.sin(angle) * 18);
    }
  }

  function buildground() {
    // Main park ground plane (using thin boxes as ground tiles)
    makebox(200, 0.2, 200, 0x3A7A1C, 0, 0, 0);
    // Paths
    makebox(80, 0.25, 3, 0xD2C8A0, 0, 0.125, 0);
    makebox(3, 0.25, 80, 0xD2C8A0, 0, 0.125, 0);
    makebox(60, 0.25, 3, 0xD2C8A0, 0, 0.125, -50);
    makebox(3, 0.25, 40, 0xD2C8A0, -50, 0.125, 0);
    makebox(3, 0.25, 40, 0xD2C8A0, 50, 0.125, 0);
  }

  function buildtrees() {
    var i;
    var tx = [-40, -35, -45, 30, 35, 25, -20, 20, -50, 50];
    var tz = [-30, -45, -15, -30, -45, -15, 60, 60, -60, -60];
    for (i = 0; i < 10; i++) {
      makecylinder(0.4, 0.5, 4, 6, 0x6B4226, tx[i], 2, tz[i]);
      makebox(4, 5, 4, 0x228B22, tx[i], 6.5, tz[i]);
    }
  }

  function init(sceneref) {
    scene = sceneref;
    buildground();
    buildtrees();
    buildlake();
    buildtheatre();
    buildnashterraces();
    buildzoo();
    buildprimrosehill();
    buildcanal();
    buildrosegarden();
    buildinnercircle();
    buildwinfieldhouse();
    buildstjohnswood();
  }

  function update(dt) {
    // static environment, no per-frame updates needed
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) objects[i].geometry.dispose();
      if (objects[i].material) objects[i].material.dispose();
    }
    objects = [];
    scene = null;
  }

  return { init: init, update: update, reset: reset };
}());
