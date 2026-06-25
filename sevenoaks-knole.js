window.SevenoaksKnole = (function() {
  'use strict';

  function init(scene, objects) {
    var ox = 6080;
    var oz = 0;

    function addbox(w, h, d, color, x, y, z) {
      var geo = new THREE.BoxGeometry(w, h, d);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ox + x, y, oz + z);
      scene.add(mesh);
      objects.push(mesh);
      return mesh;
    }

    function addcyl(rt, rb, h, color, x, y, z) {
      var geo = new THREE.CylinderGeometry(rt, rb, h, 12);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ox + x, y, oz + z);
      scene.add(mesh);
      objects.push(mesh);
      return mesh;
    }

    function addsphere(r, color, x, y, z) {
      var geo = new THREE.SphereGeometry(r, 12, 10);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ox + x, y, oz + z);
      scene.add(mesh);
      objects.push(mesh);
      return mesh;
    }

    function addcone(r, h, color, x, y, z) {
      var geo = new THREE.ConeGeometry(r, h, 10);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ox + x, y, oz + z);
      scene.add(mesh);
      objects.push(mesh);
      return mesh;
    }

    // 1. Knole House main range — 60×12×20, stone, y=6
    addbox(60, 12, 20, 0xCCBBAA, 0, 6, 0);

    // 2. Knole dormers — 5 boxes 3×4×2 along roof, y=14
    var dormerZOffsets = [-8, -4, 0, 4, 8];
    for (var d = 0; d < 5; d++) {
      addbox(3, 4, 2, 0xCCBBAA, 0, 14, dormerZOffsets[d]);
    }

    // 3. Knole gatehouse tower — 8×16×8, y=8, 0xBBAA99
    addbox(8, 16, 8, 0xBBAA99, -35, 8, 0);

    // 4. Knole gatehouse cone cap — 6r×4, y=16
    addcone(6, 4, 0xBBAA99, -35, 18, 0);

    // 5. Deer park wall — 80×3×1.5, z=-30, y=1.5, 0xBBB9A0
    addbox(80, 3, 1.5, 0xBBB9A0, 0, 1.5, -30);

    // 6. 8 deer — body 1.5×0.8×0.8 + head 0.4×0.4×0.4, brown 0x8B5A2B
    var deerPositions = [
      [-20, -40], [-14, -42], [-8, -38], [-2, -44],
      [4, -41], [10, -39], [16, -43], [22, -40]
    ];
    for (var i = 0; i < 8; i++) {
      var dx = deerPositions[i][0];
      var dz = deerPositions[i][1];
      addbox(1.5, 0.8, 0.8, 0x8B5A2B, dx, 0.8, dz);
      addbox(0.4, 0.4, 0.4, 0x8B5A2B, dx + 0.8, 1.1, dz);
    }

    // 7. 12 Georgian shops (high street) — 2 rows of 6, each 6×8×7
    var shopColors = [0xF5F0E0, 0x9B4A3A, 0xF5F0E0, 0x9B4A3A, 0xF5F0E0, 0x9B4A3A];
    for (var s = 0; s < 6; s++) {
      addbox(6, 8, 7, shopColors[s], -40 + s * 8, 4, 50);
      addbox(6, 8, 7, shopColors[5 - s], -40 + s * 8, 4, 60);
    }

    // 8. 7 oak trees — sphere canopy 3r + cylinder trunk 0.6r×6, in a row
    for (var t = 0; t < 7; t++) {
      var tx = -30 + t * 10;
      addcyl(0.6, 0.6, 6, 0x5A4A2A, tx, 3, 35);
      addsphere(3, 0x3A5A1A, tx, 8, 35);
    }

    // 9. Parish church body — 20×9×12, 0xCCBBAA
    addbox(20, 9, 12, 0xCCBBAA, 50, 4.5, 20);

    // 10. Church tower — 5×15×5, 0xCCBBAA
    addbox(5, 15, 5, 0xCCBBAA, 62, 7.5, 20);

    // 11. Church spire — 4r×12, 0xBBAA99
    addcone(4, 12, 0xBBAA99, 62, 21, 20);

    // 12. Cricket pavilion — 12×4×8, cream 0xF5F0E0
    addbox(12, 4, 8, 0xF5F0E0, 30, 2, -60);

    // 13. Cricket ground fence — 6 thin boxes forming oval perimeter
    addbox(10, 1.5, 0.3, 0xFFFFFF, 30, 0.75, -75);
    addbox(10, 1.5, 0.3, 0xFFFFFF, 30, 0.75, -45);
    addbox(0.3, 1.5, 10, 0xFFFFFF, 18, 0.75, -60);
    addbox(0.3, 1.5, 10, 0xFFFFFF, 42, 0.75, -60);
    addbox(10, 1.5, 0.3, 0xFFFFFF, 20, 0.75, -70);
    addbox(10, 1.5, 0.3, 0xFFFFFF, 40, 0.75, -50);

    // 14. Railway station — 20×6×12, brick 0x885533
    addbox(20, 6, 12, 0x885533, -60, 3, 60);

    // 15. Platform canopy — 25×0.5×6, 0x778888, y=5.5
    addbox(25, 0.5, 6, 0x778888, -60, 5.5, 55);
  }

  return { init: init };
}());
