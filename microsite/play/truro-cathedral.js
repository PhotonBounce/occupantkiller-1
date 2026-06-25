(function () {
  'use strict';

  window.TruroCathedral = function (scene) {
    var OX = 8080;
    var OZ = 0;

    function material(color) {
      return new THREE.MeshLambertMaterial({ color: color });
    }

    function box(w, h, d, col, x, y, z) {
      var geo = new THREE.BoxGeometry(w, h, d);
      var mesh = new THREE.Mesh(geo, material(col));
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    function cylinder(rt, rb, h, seg, col, x, y, z) {
      var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
      var mesh = new THREE.Mesh(geo, material(col));
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    function cone(r, h, seg, col, x, y, z) {
      var geo = new THREE.ConeGeometry(r, h, seg);
      var mesh = new THREE.Mesh(geo, material(col));
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    function sphere(r, ws, hs, col, x, y, z) {
      var geo = new THREE.SphereGeometry(r, ws, hs);
      var mesh = new THREE.Mesh(geo, material(col));
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    function lines(geo, col, x, y, z) {
      var mat = new THREE.LineBasicMaterial({ color: col });
      var mesh = new THREE.LineSegments(geo, mat);
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    function cathedral() {
      var granite = 0x777766;
      // Long nave
      box(35, 12, 16, granite, 0, 6, 0);
      // Central spire cone on top of nave centre
      cone(5, 25, 8, granite, 0, 12 + 12.5, 0);
      // Two west tower boxes flanking the west front
      box(6, 20, 6, granite, -14, 10, -10);
      box(6, 20, 6, granite, 14, 10, -10);
      // Two west flanking spires (ConeGeometry 4r x 20)
      cone(4, 20, 8, granite, -14, 20 + 10, -10);
      cone(4, 20, 8, granite, 14, 20 + 10, -10);
      // West front connecting wall
      box(28, 20, 2, granite, 0, 10, -11);
      // Transept
      box(12, 10, 28, granite, 0, 5, 0);
    }

    function museum() {
      var stone = 0xE8E0D0;
      // Main building
      box(20, 8, 15, stone, 60, 4, -30);
      // 4 columns
      cylinder(1, 1, 8, 8, stone, 52, 4, -22);
      cylinder(1, 1, 8, 8, stone, 56, 4, -22);
      cylinder(1, 1, 8, 8, stone, 60, 4, -22);
      cylinder(1, 1, 8, 8, stone, 64, 4, -22);
      // Pediment
      box(22, 2, 2, stone, 60, 9, -22);
    }

    function lemon() {
      var terrace = 0xF0EDE0;
      for (var i = 0; i < 10; i++) {
        var yi = i * 1;
        box(6, 9, 10, terrace, -60 + i * 7, 4.5 + yi, 20);
      }
    }

    function fal() {
      box(60, 0.3, 8, 0x336688, 20, 0.15, 50);
    }

    function cityhall() {
      box(18, 8, 14, 0xD4C9A8, -40, 4, -40);
      // Victorian baroque dome suggestion
      cylinder(3, 4, 3, 8, 0xD4C9A8, -40, 9.5, -40);
      cone(2, 4, 8, 0xD4C9A8, -40, 13, -40);
    }

    function quayside() {
      // Stone quay
      box(50, 0.5, 3, 0xAA9988, 10, 0.25, 45);
      // 4 moored boats (small box hulls + tiny masts)
      var boatcol = 0x995544;
      var i;
      for (i = 0; i < 4; i++) {
        box(5, 0.8, 2, boatcol, -10 + i * 12, 0.9, 44);
        // Mast as thin cylinder
        cylinder(0.1, 0.1, 4, 4, 0x553322, -10 + i * 12, 3, 44);
      }
    }

    function hall() {
      box(20, 8, 18, 0x778899, -80, 4, 10);
      // Entrance canopy
      box(8, 1, 4, 0x556677, -80, 8.5, 1);
    }

    function wireframe() {
      // Add simple wireframe outline on cathedral nave using LineSegments
      var geo = new THREE.BoxGeometry(35, 12, 16);
      var edges = new THREE.EdgesGeometry(geo);
      lines(edges, 0x444433, 0, 6, 0);
    }

    cathedral();
    museum();
    lemon();
    fal();
    cityhall();
    quayside();
    hall();
    wireframe();
  };
}());
