(function (window) {
  window.PenzanceMount = function (scene) {
    var OX = 8240;
    var OZ = 0;

    function granite(color) {
      return new THREE.MeshLambertMaterial({ color: color });
    }

    function box(w, h, d, mat, x, y, z) {
      var geo = new THREE.BoxGeometry(w, h, d);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    function cylinder(rt, rb, h, seg, mat, x, y, z) {
      var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    function cone(r, h, seg, mat, x, y, z) {
      var geo = new THREE.ConeGeometry(r, h, seg);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    function sphere(r, ws, hs, mat, x, y, z) {
      var geo = new THREE.SphereGeometry(r, ws, hs);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    function lines(geo, mat, x, y, z) {
      var mesh = new THREE.LineSegments(geo, mat);
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    // --- 3) Mount's Bay water ---
    var waterMat = granite(0x4488BB);
    box(80, 0.3, 30, waterMat, 0, 0, 0);

    // --- 1) St Michael's Mount island ---
    var islandMat = granite(0x888877);

    // Flat base
    box(30, 0.3, 20, islandMat, -20, 0.3, -5);

    // Conical granite hill — 4 stacked boxes forming mound h=12
    box(22, 3, 15, islandMat, -20, 1.8, -5);
    box(16, 3, 11, islandMat, -20, 4.8, -5);
    box(12, 3, 8,  islandMat, -20, 7.8, -5);
    box(8,  3, 5,  islandMat, -20, 10.8, -5);

    // Castle keep on top
    var keepMat = granite(0x888877);
    box(10, 10, 10, keepMat, -20, 17.3, -5);

    // Chapel tower
    var towerMat = granite(0x888877);
    cylinder(3, 3, 8, 8, towerMat, -16, 26.3, -5);

    // Cone cap
    var capMat = granite(0x888877);
    cone(3, 4, 8, capMat, -16, 31.3, -5);

    // --- 2) Causeway to Mount ---
    var causewayMat = granite(0xBBAA88);
    box(3, 0.3, 40, causewayMat, -5, 0.3, -5);

    // --- 4) Jubilee Pool — triangular seawater pool ---
    var poolMat = granite(0x3399CC);
    var surroundMat = granite(0xFFFFFF);

    // Pool water base (triangular approximated by 3 overlapping boxes)
    box(18, 0.2, 12, poolMat, 22, 0.2, 10);

    // 3 walls forming triangle shape
    box(20, 1, 0.5, surroundMat, 22, 0.85, 4);   // south wall
    box(0.5, 1, 14, surroundMat, 12, 0.85, 10);   // west wall
    box(0.5, 1, 14, surroundMat, 32, 0.85, 10);   // east wall (angled approximation)

    // White pool surround
    box(22, 0.3, 16, surroundMat, 22, 0.45, 10);

    // --- 5) Penzance Promenade ---
    var hotelMat = granite(0xF5F0E0);

    // 6 Victorian hotels
    var i;
    for (i = 0; i < 6; i++) {
      box(12, 10, 8, hotelMat, 10 + i * 14, 5, -15);
    }

    // Palm trees — 4 of them
    var trunkMat = granite(0x885522);
    var frondMat = granite(0x226611);

    var palmPositions = [15, 29, 43, 57];
    for (i = 0; i < 4; i++) {
      var px = palmPositions[i];
      cylinder(0.5, 0.5, 6, 6, trunkMat, px, 3, -20);
      cone(3, 2, 8, frondMat, px, 7, -20);
    }

    // --- 6) Penzance town — Newlyn fishing port ---
    var newlynMat = granite(0x999988);

    // 8 stone buildings
    for (i = 0; i < 8; i++) {
      box(5, 7, 8, newlynMat, 10 + i * 7, 3.5, -28);
    }

    // --- 7) Newlyn Art Gallery ---
    var galleryMat = granite(0x885533);
    box(12, 10, 6, galleryMat, 70, 5, -28);
  };
}(window));
