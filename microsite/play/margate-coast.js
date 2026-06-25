window.MargateCoast = (function() {
  'use strict';

  var OX = 4400;
  var OZ = 2200;
  var objects = [];
  var scene = null;

  function addbox(sc, w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    sc.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addcylinder(sc, rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    sc.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addsphere(sc, r, segs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, segs, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    sc.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addspoke(sc, dlx, dlz, angle) {
    var geo = new THREE.BoxGeometry(0.6, 24, 0.6);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + dlx + 80, 14, OZ + dlz + 5);
    mesh.rotation.z = angle;
    sc.add(mesh);
    objects.push(mesh);
  }

  function buildturner(sc) {
    // Turner Contemporary gallery — main pale grey box building on seafront
    addbox(sc, 24, 12, 8, 0xE8E8E8, 0, 6, 0);
    // Glass facade panels — front and back
    addbox(sc, 20, 10, 0.3, 0x87CEEB, 0, 6, -4.2);
    addbox(sc, 20, 10, 0.3, 0x87CEEB, 0, 6, 4.2);
    // Side glass panels
    addbox(sc, 0.3, 10, 6, 0x87CEEB, -12.2, 6, 0);
    addbox(sc, 0.3, 10, 6, 0x87CEEB, 12.2, 6, 0);
    // Roof detail
    addbox(sc, 26, 1, 10, 0xD0D0D0, 0, 12.5, 0);
    // Foundation plinth
    addbox(sc, 26, 1, 10, 0xC0C0C0, 0, 0.5, 0);
  }

  function buildoldharbour(sc) {
    // Margate Old Harbour — crescent-shaped stone harbour arm C-shape
    var i;
    var cx = 60;
    var cz = 20;
    var r = 25;
    for (i = 0; i < 30; i++) {
      var angle = (Math.PI * 1.5) * (i / 29) - Math.PI * 0.25;
      var bx = cx + Math.cos(angle) * r;
      var bz = cz + Math.sin(angle) * r;
      addbox(sc, 4, 4, 4, 0x808080, bx, 2, bz);
    }
    // Harbour wall cap stones
    for (i = 0; i < 30; i++) {
      var capangle = (Math.PI * 1.5) * (i / 29) - Math.PI * 0.25;
      var capx = cx + Math.cos(capangle) * r;
      var capz = cz + Math.sin(capangle) * r;
      addbox(sc, 4.2, 0.5, 4.2, 0x696969, capx, 4.25, capz);
    }
    // Fishing boats inside harbour
    addbox(sc, 6, 2, 3, 0x8B4513, cx - 8, 1, cz - 5);
    addbox(sc, 6, 2, 3, 0x228B22, cx + 5, 1, cz - 5);
    addbox(sc, 5, 1.5, 2.5, 0x4169E1, cx, 0.75, cz + 5);
    // Boat masts
    addbox(sc, 0.2, 6, 0.2, 0x8B4513, cx - 8, 5, cz - 5);
    addbox(sc, 0.2, 6, 0.2, 0x8B4513, cx + 5, 5, cz - 5);
    // Harbour master building
    addbox(sc, 5, 4, 4, 0x909090, cx + r + 3, 2, cz);
  }

  function builddreamland(sc) {
    // Dreamland amusement park — historic Margate funfair
    var i;
    var dlx = -60;
    var dlz = -40;
    // Ground base
    addbox(sc, 80, 0.5, 40, 0x555555, dlx + 40, 0.25, dlz + 20);
    // Rollercoaster track supports — frames
    for (i = 0; i < 8; i++) {
      addbox(sc, 1.5, 12, 1.5, 0xFF6600, dlx + i * 8, 6, dlz);
      addbox(sc, 1.5, 12, 1.5, 0xFF6600, dlx + i * 8, 6, dlz + 10);
      addbox(sc, i * 8 < 56 ? 8 : 8, 1, 1, 0xFF4400, dlx + i * 8 + 4, 12, dlz + 5);
      // Cross braces
      addbox(sc, 1, 1, 12, 0xFF5500, dlx + i * 8, 9, dlz + 5);
    }
    // Rollercoaster high point
    addbox(sc, 4, 16, 4, 0xFF6600, dlx + 32, 8, dlz + 5);
    // Ferris wheel hub cylinder
    addcylinder(sc, 1.5, 1.5, 3, 8, 0xCC4400, dlx + 80, 14, dlz + 5);
    // Ferris wheel outer ring
    addcylinder(sc, 12, 12, 1.5, 24, 0xFF6600, dlx + 80, 14, dlz + 5);
    // Ferris wheel spokes
    for (i = 0; i < 8; i++) {
      addspoke(sc, dlx, dlz, (i / 8) * Math.PI * 2);
    }
    // Ferris wheel support legs
    addbox(sc, 1.5, 14, 1.5, 0xCC3300, dlx + 76, 7, dlz + 5);
    addbox(sc, 1.5, 14, 1.5, 0xCC3300, dlx + 84, 7, dlz + 5);
    // Carousel base
    addbox(sc, 10, 1, 10, 0xFF0000, dlx + 100, 0.5, dlz + 5);
    // Carousel pole
    addcylinder(sc, 0.5, 0.5, 8, 8, 0xFFDD00, dlx + 100, 4, dlz + 5);
    // Carousel roof
    addcylinder(sc, 6, 1, 2, 12, 0xFF0000, dlx + 100, 9, dlz + 5);
    // Carousel body ring
    addcylinder(sc, 5, 5, 4, 12, 0xFFAA00, dlx + 100, 3, dlz + 5);
    // Amusement stalls
    addbox(sc, 6, 4, 5, 0xFF3300, dlx + 115, 2, dlz + 5);
    addbox(sc, 6, 4, 5, 0xFF6600, dlx + 123, 2, dlz + 5);
    addbox(sc, 6, 4, 5, 0xFFAA00, dlx + 131, 2, dlz + 5);
    // Entrance arch
    addbox(sc, 14, 1, 2, 0xFF6600, dlx + 7, 8, dlz + 20);
    addbox(sc, 2, 8, 2, 0xFF6600, dlx, 4, dlz + 20);
    addbox(sc, 2, 8, 2, 0xFF6600, dlx + 14, 4, dlz + 20);
  }

  function buildgrotto(sc) {
    // Margate Shell Grotto — Victorian discovery, subterranean passages
    var i;
    var gx = -30;
    var gz = 60;
    // Hill mound
    addbox(sc, 16, 8, 16, 0x8B7355, gx, 4, gz);
    // Secondary mound layer
    addbox(sc, 10, 4, 10, 0x7A6344, gx, 9, gz);
    // Grotto entrance tunnel opening
    addbox(sc, 4, 5, 6, 0x2F2F2F, gx, 2.5, gz - 8);
    // Entrance frame
    addbox(sc, 5, 0.5, 0.5, 0x6B5B45, gx, 5, gz - 8);
    addbox(sc, 0.5, 5, 0.5, 0x6B5B45, gx - 2.5, 2.5, gz - 8);
    addbox(sc, 0.5, 5, 0.5, 0x6B5B45, gx + 2.5, 2.5, gz - 8);
    // Shell-encrusted walls — SphereGeometry pebble clusters
    for (i = 0; i < 50; i++) {
      var shellx = gx + (Math.sin(i * 1.3) * 7);
      var shelly = Math.abs(Math.sin(i * 0.7)) * 7 + 0.3;
      var shellz = gz + (Math.cos(i * 1.1) * 7);
      addsphere(sc, 0.25, 4, 0xFAFAF0, shellx, shelly, shellz);
    }
    // Extra shell clusters on entrance
    for (i = 0; i < 20; i++) {
      var ex = gx + (Math.sin(i * 2.1) * 2.2);
      var ey = Math.abs(Math.cos(i * 1.7)) * 4 + 0.5;
      var ez = gz - 8 + (Math.sin(i * 0.9) * 2.5);
      addsphere(sc, 0.2, 4, 0xFAFAF0, ex, ey, ez);
    }
  }

  function buildoystershacks(sc) {
    // Whitstable oyster shacks — weatherboard huts on pebble beach
    var i;
    var shx = 120;
    var shz = 80;
    // Pebble beach base
    addbox(sc, 60, 0.4, 12, 0x9E9E8E, shx + 24, 0.2, shz);
    for (i = 0; i < 8; i++) {
      // Main hut body — dark grey weatherboard
      addbox(sc, 5, 4, 4, 0x4A4A4A, shx + i * 7, 2, shz);
      // Roof — slightly lighter
      addbox(sc, 5.5, 1, 4.5, 0x3A3A3A, shx + i * 7, 4.5, shz);
      // Door
      addbox(sc, 1.2, 2, 0.2, 0x5C4033, shx + i * 7, 1, shz - 2.1);
    }
    // Oyster crates stacked outside
    addbox(sc, 2, 1, 2, 0x6B5B3E, shx + 3, 0.5, shz - 4);
    addbox(sc, 2, 1, 2, 0x6B5B3E, shx + 3, 1.5, shz - 4);
    addbox(sc, 2, 1, 2, 0x5C4C2F, shx + 10, 0.5, shz - 4);
    // Signpost
    addbox(sc, 0.2, 4, 0.2, 0x8B6914, shx - 3, 2, shz);
  }

  function buildwhitstableharbour(sc) {
    // Whitstable Harbour — working fishing harbour with trawlers
    var whx = 150;
    var whz = 50;
    // Main harbour walls — Box harbour structure
    addbox(sc, 60, 4, 3, 0x707070, whx + 30, 2, whz);
    addbox(sc, 60, 4, 3, 0x707070, whx + 30, 2, whz + 40);
    addbox(sc, 3, 4, 40, 0x707070, whx, 2, whz + 20);
    addbox(sc, 3, 4, 40, 0x707070, whx + 60, 2, whz + 20);
    // Harbour wall cap
    addbox(sc, 62, 0.5, 3.5, 0x606060, whx + 30, 4.25, whz);
    addbox(sc, 62, 0.5, 3.5, 0x606060, whx + 30, 4.25, whz + 40);
    // Fishing trawlers — blue and red hulls
    addbox(sc, 10, 3, 4, 0x1E3A8A, whx + 15, 1.5, whz + 15);
    addbox(sc, 8, 2.5, 3.5, 0xCC2200, whx + 30, 1.25, whz + 25);
    addbox(sc, 9, 3, 4, 0x1A5276, whx + 45, 1.5, whz + 15);
    // Oyster dredger boats
    addbox(sc, 12, 3, 5, 0x2C3E50, whx + 20, 1.5, whz + 32);
    addbox(sc, 10, 2.5, 4, 0x4A235A, whx + 40, 1.25, whz + 32);
    // Boat cabins
    addbox(sc, 3, 2, 3, 0xF0F0F0, whx + 15, 4, whz + 15);
    addbox(sc, 3, 2, 3, 0xF0F0F0, whx + 30, 3.75, whz + 25);
    // Boat masts
    addbox(sc, 0.3, 8, 0.3, 0x8B4513, whx + 15, 7, whz + 15);
    addbox(sc, 0.3, 8, 0.3, 0x8B4513, whx + 30, 7, whz + 25);
    addbox(sc, 0.3, 8, 0.3, 0x8B4513, whx + 45, 7, whz + 15);
    // Harbour crane
    addbox(sc, 1, 10, 1, 0xFFCC00, whx + 58, 5, whz + 20);
    addbox(sc, 8, 1, 1, 0xFFCC00, whx + 54, 10, whz + 20);
    // Fish market shed
    addbox(sc, 15, 5, 10, 0x8B7355, whx + 50, 2.5, whz + 5);
  }

  function buildwhitstablecastle(sc) {
    // Whitstable Castle — mock-Gothic regency villa, cream coloured
    var wcx = 200;
    var wcz = 100;
    // Main castle body
    addbox(sc, 20, 10, 16, 0xFFF8DC, wcx, 5, wcz);
    // Central raised section
    addbox(sc, 10, 14, 10, 0xFFF8DC, wcx, 7, wcz);
    // Four corner turrets — CylinderGeometry
    addcylinder(sc, 2, 2, 14, 8, 0xFFF8DC, wcx - 10, 7, wcz - 8);
    addcylinder(sc, 2, 2, 14, 8, 0xFFF8DC, wcx + 10, 7, wcz - 8);
    addcylinder(sc, 2, 2, 14, 8, 0xFFF8DC, wcx - 10, 7, wcz + 8);
    addcylinder(sc, 2, 2, 14, 8, 0xFFF8DC, wcx + 10, 7, wcz + 8);
    // Turret caps — cone tops
    addcylinder(sc, 0.1, 2.2, 3, 8, 0xDDD8C0, wcx - 10, 15.5, wcz - 8);
    addcylinder(sc, 0.1, 2.2, 3, 8, 0xDDD8C0, wcx + 10, 15.5, wcz - 8);
    addcylinder(sc, 0.1, 2.2, 3, 8, 0xDDD8C0, wcx - 10, 15.5, wcz + 8);
    addcylinder(sc, 0.1, 2.2, 3, 8, 0xDDD8C0, wcx + 10, 15.5, wcz + 8);
    // Battlements on main body
    addbox(sc, 2, 1.5, 1, 0xFFF8DC, wcx - 8, 11, wcz - 8);
    addbox(sc, 2, 1.5, 1, 0xFFF8DC, wcx - 3, 11, wcz - 8);
    addbox(sc, 2, 1.5, 1, 0xFFF8DC, wcx + 3, 11, wcz - 8);
    addbox(sc, 2, 1.5, 1, 0xFFF8DC, wcx + 8, 11, wcz - 8);
    addbox(sc, 2, 1.5, 1, 0xFFF8DC, wcx - 8, 11, wcz + 8);
    addbox(sc, 2, 1.5, 1, 0xFFF8DC, wcx - 3, 11, wcz + 8);
    addbox(sc, 2, 1.5, 1, 0xFFF8DC, wcx + 3, 11, wcz + 8);
    addbox(sc, 2, 1.5, 1, 0xFFF8DC, wcx + 8, 11, wcz + 8);
    // Gothic arched windows (box approximation)
    addbox(sc, 2, 4, 0.3, 0x87CEEB, wcx - 5, 5, wcz - 8.2);
    addbox(sc, 2, 4, 0.3, 0x87CEEB, wcx, 5, wcz - 8.2);
    addbox(sc, 2, 4, 0.3, 0x87CEEB, wcx + 5, 5, wcz - 8.2);
    // Entrance porch
    addbox(sc, 5, 5, 3, 0xFFF0CC, wcx, 2.5, wcz - 11);
    // Garden wall
    addbox(sc, 30, 2, 1, 0xE8DCC8, wcx, 1, wcz - 18);
    addbox(sc, 1, 2, 20, 0xE8DCC8, wcx - 15, 1, wcz - 8);
    addbox(sc, 1, 2, 20, 0xE8DCC8, wcx + 15, 1, wcz - 8);
  }

  function buildreculvertowers(sc) {
    // Reculver Towers — Roman fort ruins with twin Norman towers on cliff edge
    var rtx = -120;
    var rtz = -80;
    // Cliff base
    addbox(sc, 40, 6, 20, 0xFAFAF0, rtx, 3, rtz);
    // Roman fort ruin walls — low remnants
    addbox(sc, 30, 2, 1.5, 0x888888, rtx, 7, rtz - 8);
    addbox(sc, 30, 2, 1.5, 0x888888, rtx, 7, rtz + 8);
    addbox(sc, 1.5, 2, 16, 0x888888, rtx - 15, 7, rtz);
    addbox(sc, 1.5, 2, 16, 0x888888, rtx + 15, 7, rtz);
    // Twin Norman towers — 5x5x14 each, stone grey
    addbox(sc, 5, 14, 5, 0x888888, rtx - 5, 13, rtz);
    addbox(sc, 5, 14, 5, 0x888888, rtx + 5, 13, rtz);
    // Tower battlements
    addbox(sc, 1.5, 2, 1.5, 0x888888, rtx - 7, 21, rtz - 2);
    addbox(sc, 1.5, 2, 1.5, 0x888888, rtx - 7, 21, rtz + 2);
    addbox(sc, 1.5, 2, 1.5, 0x888888, rtx - 3, 21, rtz - 2);
    addbox(sc, 1.5, 2, 1.5, 0x888888, rtx - 3, 21, rtz + 2);
    addbox(sc, 1.5, 2, 1.5, 0x888888, rtx + 3, 21, rtz - 2);
    addbox(sc, 1.5, 2, 1.5, 0x888888, rtx + 3, 21, rtz + 2);
    addbox(sc, 1.5, 2, 1.5, 0x888888, rtx + 7, 21, rtz - 2);
    addbox(sc, 1.5, 2, 1.5, 0x888888, rtx + 7, 21, rtz + 2);
    // Connecting arch between towers at mid-height
    addbox(sc, 10, 2, 3, 0x808080, rtx, 16, rtz);
    // Ruin rubble — scattered blocks
    addbox(sc, 3, 1.5, 2, 0x777777, rtx - 18, 7.75, rtz - 5);
    addbox(sc, 2, 1, 3, 0x888888, rtx + 18, 6.5, rtz + 3);
    addbox(sc, 4, 1, 2, 0x999999, rtx - 10, 7.5, rtz + 10);
  }

  function buildchalkcliffs(sc) {
    // Isle of Thanet chalk cliffs — Box cliff face along Margate's north coast
    var i;
    var clx = -200;
    var clz = -120;
    // Main cliff face — long stretch of chalk white boxes
    for (i = 0; i < 12; i++) {
      var cheight = 15 + Math.floor(Math.sin(i * 0.7) * 4);
      addbox(sc, 18, cheight, 10, 0xFAFAF0, clx + i * 18, cheight / 2, clz);
      // Cliff face variation — slightly different shades layered
      addbox(sc, 18, 3, 8, 0xF0F0E8, clx + i * 18, cheight - 1, clz + 1);
    }
    // Cliff top grass strip
    addbox(sc, 216, 1, 6, 0x5D8A3C, clx + 108, cheight + 0.5, clz + 3);
    // Beach at cliff base
    addbox(sc, 216, 0.5, 15, 0xF5DEB3, clx + 108, 0.25, clz + 12);
    // Rock outcroppings at base
    addbox(sc, 4, 3, 4, 0xE8E8E0, clx + 20, 1.5, clz + 8);
    addbox(sc, 5, 2, 3, 0xEEEEE6, clx + 80, 1, clz + 10);
    addbox(sc, 3, 2.5, 4, 0xE0E0D8, clx + 150, 1.25, clz + 9);
  }

  function buildnorthsea(sc) {
    // North Sea — dark blue-grey water extending north from coast
    // Large water body — Box geometry, dark navy blue
    addbox(sc, 400, 1, 200, 0x000080, 0, -0.5, -200);
    // Deeper water further out — darker
    addbox(sc, 400, 1, 100, 0x00006A, 0, -1, -350);
    // Wave suggestion — slightly lighter strips
    addbox(sc, 400, 0.3, 8, 0x0000AA, 0, 0.15, -80);
    addbox(sc, 400, 0.3, 8, 0x0000AA, 0, 0.15, -130);
    addbox(sc, 400, 0.3, 8, 0x000099, 0, 0.15, -180);
    // Shoreline foam strip
    addbox(sc, 400, 0.3, 3, 0xDDEEFF, 0, 0.15, -55);
    // Sea horizon box
    addbox(sc, 400, 20, 5, 0x000066, 0, 10, -450);
  }

  function init(sc) {
    scene = sc;
    buildturner(sc);
    buildoldharbour(sc);
    builddreamland(sc);
    buildgrotto(sc);
    buildoystershacks(sc);
    buildwhitstableharbour(sc);
    buildwhitstablecastle(sc);
    buildreculvertowers(sc);
    buildchalkcliffs(sc);
    buildnorthsea(sc);
  }

  function update(dt) {}

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    scene = null;
  }

  return { init: init, update: update, reset: reset };
}());
