(function (window) {
  window.WeymouthShore = function (scene) {
    var X = 7480;
    var Z = 0;

    function offset(x, y, z) {
      return new THREE.Vector3(X + x, y, Z + z);
    }

    function box(w, h, d, color, x, y, z) {
      var geo = new THREE.BoxGeometry(w, h, d);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(X + x, y, Z + z);
      scene.add(mesh);
      return mesh;
    }

    function cylinder(rt, rb, h, segs, color, x, y, z) {
      var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(X + x, y, Z + z);
      scene.add(mesh);
      return mesh;
    }

    function cone(r, h, segs, color, x, y, z) {
      var geo = new THREE.ConeGeometry(r, h, segs);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(X + x, y, Z + z);
      scene.add(mesh);
      return mesh;
    }

    function sphere(r, ws, hs, color, x, y, z) {
      var geo = new THREE.SphereGeometry(r, ws, hs);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(X + x, y, Z + z);
      scene.add(mesh);
      return mesh;
    }

    function lines(points, color) {
      var geo = new THREE.BufferGeometry().setFromPoints(points);
      var mat = new THREE.LineBasicMaterial({ color: color });
      var seg = new THREE.LineSegments(geo, mat);
      scene.add(seg);
      return seg;
    }

    // 1. Weymouth Esplanade — Georgian terraces (2 rows of 6 each)
    var terraceColor = 0xF5F0E0;
    for (var row = 0; row < 2; row++) {
      for (var col = 0; col < 6; col++) {
        var tx = -30 + col * 13;
        var tz = -10 + row * 14;
        box(12, 10, 12, terraceColor, tx, 5, tz);
        // Roof
        box(12, 1, 12, 0xDDCCBB, tx, 10.5, tz);
        // Windows (front face decoration)
        for (var floor = 0; floor < 3; floor++) {
          for (var win = 0; win < 2; win++) {
            box(1.2, 1.8, 0.2, 0x8899AA, tx - 2.5 + win * 5, 2 + floor * 3, tz - 6.1);
          }
        }
      }
    }
    // Third row of terraces
    for (var col3 = 0; col3 < 6; col3++) {
      var tx3 = -30 + col3 * 13;
      box(12, 10, 12, terraceColor, tx3, 5, -24);
    }

    // 2. King George III equestrian statue
    // Plinth
    box(2, 5, 2, 0x8B7355, 15, 2.5, -5);
    // Horse body
    box(2, 1.5, 1, 0x8B7355, 15, 6.75, -5);
    // Horse legs
    box(0.25, 1.2, 0.25, 0x8B7355, 14.3, 5.6, -4.7);
    box(0.25, 1.2, 0.25, 0x8B7355, 15.7, 5.6, -4.7);
    box(0.25, 1.2, 0.25, 0x8B7355, 14.3, 5.6, -5.3);
    box(0.25, 1.2, 0.25, 0x8B7355, 15.7, 5.6, -5.3);
    // Horse head
    box(0.5, 0.6, 0.8, 0x8B7355, 15, 7.8, -5.8);
    // Rider body
    box(0.8, 1, 0.8, 0x8B7355, 15, 8.5, -5);
    // Rider head
    sphere(0.35, 8, 8, 0x8B7355, 15, 9.35, -5);

    // 3. Jubilee Clock — 1887 clocktower
    // Shaft
    box(2, 8, 2, 0xCC8844, 5, 4, -5);
    // Clock face boxes (4 sides)
    box(2.5, 2.5, 0.2, 0xEEDDBB, 5, 9, -6.1);
    box(2.5, 2.5, 0.2, 0xEEDDBB, 5, 9, -3.9);
    box(0.2, 2.5, 2.5, 0xEEDDBB, 6.1, 9, -5);
    box(0.2, 2.5, 2.5, 0xEEDDBB, 3.9, 9, -5);
    // Clock cap
    cone(1.5, 3, 8, 0xAA6622, 5, 13.5, -5);

    // 4. Weymouth Harbour
    // Harbour arm 1 (west)
    box(40, 1, 3, 0x888888, -20, 0.5, 15);
    // Harbour arm 2 (east)
    box(3, 1, 20, 0x888888, 20, 0.5, 5);

    // Fishing boats (3)
    for (var b = 0; b < 3; b++) {
      box(4, 1, 1.5, 0x993322, -5 + b * 6, 1, 13);
      // Cabin
      box(1.5, 1, 1, 0xCCBB99, -5 + b * 6, 2, 13);
      // Mast
      box(0.15, 4, 0.15, 0x664433, -5 + b * 6, 4, 13);
    }

    // Moored yachts (10)
    for (var y2 = 0; y2 < 10; y2++) {
      var yx = -25 + y2 * 5;
      var yz = 10;
      box(3, 0.6, 1, 0xFFFFEE, yx, 0.8, yz);
      box(0.1, 6, 0.1, 0x886655, yx, 3.8, yz);
    }

    // 5. Sandy beach
    box(80, 0.3, 20, 0xF4E0A0, 0, 0.15, 5);

    // 6. Sea
    box(80, 0.3, 25, 0x4488BB, 0, 0, 30);

    // 7. Portland Bill lighthouse — on headland
    // Headland base
    box(20, 3, 20, 0x778866, 0, 1.5, 60);
    // Lighthouse tower
    cylinder(1, 1.5, 30, 12, 0xFFFFFF, 0, 17, 60);
    // Red stripe
    box(3.5, 3, 3.5, 0xCC2222, 0, 10, 60);
    // Lighthouse cap
    cone(2, 3, 12, 0xCC4422, 0, 33.5, 60);
    // Light room
    cylinder(1.8, 1.8, 2, 12, 0xCCCCCC, 0, 31, 60);

    // 8. Chesil Beach bank — famous tombolo shingle ridge
    box(80, 0.3, 6, 0x888877, 0, 0.15, 20);
    // Shingle texture suggestion: slightly raised sections
    for (var sh = 0; sh < 8; sh++) {
      box(9, 0.5, 5, 0x999988, -35 + sh * 10, 0.55, 20);
    }

    // 9. Nothe Fort — Victorian artillery fort: semicircular bastions
    // Main fort wall
    box(20, 5, 5, 0x886644, -20, 2.5, 8);
    // Three cylindrical bastions
    cylinder(5, 5, 5, 16, 0x886644, -28, 2.5, 8);
    cylinder(5, 5, 5, 16, 0x886644, -20, 2.5, 12);
    cylinder(5, 5, 5, 16, 0x886644, -12, 2.5, 8);
    // Fort interior courtyard
    box(14, 3, 8, 0x997755, -20, 1.5, 8);
    // Parapet
    box(22, 1, 1, 0x775533, -20, 5.5, 5.5);

    // Esplanade road/promenade
    box(80, 0.2, 5, 0xCCBBAA, 0, 0.1, -2);

    // Lamp posts along esplanade
    for (var lp = 0; lp < 8; lp++) {
      var lpx = -35 + lp * 10;
      box(0.15, 4, 0.15, 0x333333, lpx, 2, -4);
      sphere(0.3, 6, 6, 0xFFFF88, lpx, 4.3, -4);
    }
  };
}(window));
