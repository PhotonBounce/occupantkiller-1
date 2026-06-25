(function () {
  'use strict';

  window.DorchesterMaumbury = function (scene) {
    var OX = 7520;
    var OZ = 0;

    function place(mesh, x, y, z) {
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    function box(w, h, d, color) {
      var geo = new THREE.BoxGeometry(w, h, d);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      return new THREE.Mesh(geo, mat);
    }

    function cylinder(rt, rb, h, segs, color) {
      var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      return new THREE.Mesh(geo, mat);
    }

    function sphere(r, color) {
      var geo = new THREE.SphereGeometry(r, 16, 16);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      return new THREE.Mesh(geo, mat);
    }

    function cone(r, h, segs, color) {
      var geo = new THREE.ConeGeometry(r, h, segs);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      return new THREE.Mesh(geo, mat);
    }

    // ── Maiden Castle ────────────────────────────────────────────────────
    function maiden() {
      var rc = 0x6B5A3A;
      var cx = -300;
      var cz = -200;

      // Outer rampart ring sections (oval approximated by 4 sides)
      // North
      place(box(60, 4, 2, rc), cx, 2, cz - 28);
      // South
      place(box(60, 4, 2, rc), cx, 2, cz + 28);
      // West
      place(box(2, 4, 56, rc), cx - 30, 2, cz);
      // East
      place(box(2, 4, 56, rc), cx + 30, 2, cz);

      // Middle rampart ring
      place(box(45, 4, 2, rc), cx, 2, cz - 20);
      place(box(45, 4, 2, rc), cx, 2, cz + 20);
      place(box(2, 4, 40, rc), cx - 22, 2, cz);
      place(box(2, 4, 40, rc), cx + 22, 2, cz);

      // Inner rampart ring
      place(box(30, 4, 2, rc), cx, 2, cz - 12);
      place(box(30, 4, 2, rc), cx, 2, cz + 12);
      place(box(2, 4, 24, rc), cx - 15, 2, cz);
      place(box(2, 4, 24, rc), cx + 15, 2, cz);

      // Eastern gateway — overlapping mound boxes
      place(box(6, 3, 4, rc), cx + 30, 1.5, cz - 6);
      place(box(6, 3, 4, rc), cx + 30, 1.5, cz + 6);
      place(box(4, 2, 4, rc), cx + 36, 1, cz - 5);
      place(box(4, 2, 4, rc), cx + 36, 1, cz + 5);
      place(box(4, 2, 4, rc), cx + 42, 1, cz - 4);
      place(box(4, 2, 4, rc), cx + 42, 1, cz + 4);
    }

    // ── Maumbury Rings ────────────────────────────────────────────────────
    function maumbury() {
      var mc = 0x5A4A2A;
      var cx = -180;
      var cz = 50;

      // Outer earthwork oval ring (4 sides)
      place(box(20, 3, 2, mc), cx, 1.5, cz - 7);
      place(box(20, 3, 2, mc), cx, 1.5, cz + 7);
      place(box(2, 3, 14, mc), cx - 10, 1.5, cz);
      place(box(2, 3, 14, mc), cx + 10, 1.5, cz);

      // Inner arena pit (sunken — just a flat box at ground level)
      place(box(16, 1, 11, mc), cx, 0.5, cz);
    }

    // ── Dorchester High Street ─────────────────────────────────────────
    function highstreet() {
      var i;
      var colors = [0xF0EDE0, 0xCC9966];
      for (i = 0; i < 10; i++) {
        var c = colors[i % 2];
        place(box(6, 8, 8, c), -80 + i * 10, 4, 0);
      }
    }

    // ── County Museum ────────────────────────────────────────────────────
    function museum() {
      // Victorian Gothic flint
      place(box(18, 8, 14, 0xBBB8A0), -20, 4, 40);
      // Gothic pointed arch suggestion — two thin boxes
      place(box(2, 10, 2, 0xBBB8A0), -20 - 5, 9, 40 - 5);
      place(box(2, 10, 2, 0xBBB8A0), -20 + 5, 9, 40 - 5);
    }

    // ── Dorset County Hall ────────────────────────────────────────────
    function countyhall() {
      // 1939 Moderne
      place(box(35, 9, 20, 0x889988), 30, 4.5, 40);
      // Horizontal band decoration
      place(box(35, 1, 20, 0x778877), 30, 8, 40);
    }

    // ── St Peter's Church ────────────────────────────────────────────
    function stpeters() {
      // Nave
      place(box(18, 9, 12, 0xBBB8A0), -50, 4.5, 60);
      // Tower
      place(box(4, 16, 4, 0xBBB8A0), -50 - 7, 8, 60 - 4);
      // Spire
      place(cone(2, 8, 6, 0xAAAAAA), -50 - 7, 20, 60 - 4);
    }

    // ── Max Gate ─────────────────────────────────────────────────────
    function maxgate() {
      var bx = 80;
      var bz = 80;
      // Main house — red brick Victorian
      place(box(12, 8, 10, 0x993322), bx, 4, bz);
      // Garden wall — four sides
      place(box(20, 1.5, 0.5, 0x882211), bx, 0.75, bz - 9);
      place(box(20, 1.5, 0.5, 0x882211), bx, 0.75, bz + 9);
      place(box(0.5, 1.5, 18, 0x882211), bx - 10, 0.75, bz);
      place(box(0.5, 1.5, 18, 0x882211), bx + 10, 0.75, bz);
    }

    // ── Roman town house foundations ─────────────────────────────────
    function romanhouse() {
      var fc = 0xBBAA88;
      var rx = 100;
      var rz = -60;
      var i, j;
      // 4×3 room grid using low stone wall outlines
      for (i = 0; i < 5; i++) {
        place(box(40, 0.3, 1, fc), rx, 0.15, rz + i * 8);
      }
      for (j = 0; j < 5; j++) {
        place(box(1, 0.3, 32, fc), rx - 16 + j * 8, 0.15, rz + 16);
      }
    }

    // Run all builders
    maiden();
    maumbury();
    highstreet();
    museum();
    countyhall();
    stpeters();
    maxgate();
    romanhouse();
  };

}());
