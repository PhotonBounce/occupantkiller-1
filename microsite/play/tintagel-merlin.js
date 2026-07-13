(function (window) {
  'use strict';

  function init(THREE, scene, worldX, worldZ) {
    var ox = worldX !== undefined ? worldX : 7960;
    var oz = worldZ !== undefined ? worldZ : 0;
    var group = new THREE.Group();
    group.position.set(ox, 0, oz);

    // ── helpers ──────────────────────────────────────────────────────────────

    function box(w, h, d, color, x, y, z, rx, ry, rz) {
      var geo = new THREE.BoxGeometry(w, h, d);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x || 0, y || 0, z || 0);
      if (rx) mesh.rotation.x = rx;
      if (ry) mesh.rotation.y = ry;
      if (rz) mesh.rotation.z = rz;
      group.add(mesh);
      return mesh;
    }

    function cylinder(rt, rb, h, segs, color, x, y, z) {
      var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x || 0, y || 0, z || 0);
      group.add(mesh);
      return mesh;
    }

    function sphere(r, color, x, y, z) {
      var geo = new THREE.SphereGeometry(r, 8, 8);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x || 0, y || 0, z || 0);
      group.add(mesh);
      return mesh;
    }

    function cone(r, h, segs, color, x, y, z, ry) {
      var geo = new THREE.ConeGeometry(r, h, segs);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x || 0, y || 0, z || 0);
      if (ry) mesh.rotation.y = ry;
      group.add(mesh);
      return mesh;
    }

    function edges(w, h, d, color, x, y, z, ry) {
      var geo = new THREE.BoxGeometry(w, h, d);
      var mat = new THREE.LineBasicMaterial ? new THREE.LineBasicMaterial({ color: color }) : new THREE.MeshLambertMaterial({ color: color });
      var seg = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.MeshLambertMaterial({ color: color }));
      seg.position.set(x || 0, y || 0, z || 0);
      if (ry) seg.rotation.y = ry;
      group.add(seg);
      return seg;
    }

    // ── 1. SEA ───────────────────────────────────────────────────────────────
    // 80×0.3×25 at ocean level
    box(80, 0.3, 25, 0x4488BB, 0, -0.15, 5);

    // ── 2. ROCKY HEADLAND (island platform) ─────────────────────────────────
    // 4 stacked boxes forming 12m cliff
    box(22, 3, 17, 0x555544, 10, 1.5, 0);   // cliff layer 1
    box(21, 3, 16, 0x555544, 10, 4.5, 0);   // cliff layer 2
    box(20, 3, 15, 0x555544, 10, 7.5, 0);   // cliff layer 3
    box(20, 3, 15, 0x555544, 10, 10.5, 0);  // cliff layer 4 (top ~ y=12)

    // headland top surface
    box(20, 0.3, 15, 0x666655, 10, 12.15, 0);

    // ── 3. ROPE BRIDGE ──────────────────────────────────────────────────────
    // spans gap between mainland (x=0) and island (x=10), length ~10
    box(10, 0.3, 2, 0x887755, 5, 12.15, 0);

    // ── 4. TINTAGEL CASTLE RUINS ────────────────────────────────────────────
    // 3 surviving wall fragments on the headland (headland top at y=12.3)
    // wall fragment A — north curtain wall 15×6×2
    box(15, 6, 2, 0x555544, 10, 15.3, -6.5);
    // wall fragment B — east tower remnant 5×8×5
    box(5, 8, 5, 0x555544, 19, 16.3, 0);
    // wall fragment C — south partial wall 10×4×2
    box(10, 4, 2, 0x555544, 12, 14.3, 6.5);

    // battlements on north wall (small boxes)
    var bi;
    for (bi = 0; bi < 5; bi++) {
      box(2, 1.5, 0.8, 0x555544, 10 + bi * 3 - 6, 21.3 + 0.75, -6.5);
    }

    // ── 5. MERLIN'S CAVE ─────────────────────────────────────────────────────
    // sea-level cave entrance at cliff base, west side
    // arch frame
    box(4, 0.3, 6, 0x222222, -15, 0.15, -3);  // cave floor
    // left pillar
    box(0.5, 4, 6, 0x222222, -17, 2, -3);
    // right pillar
    box(0.5, 4, 6, 0x222222, -13, 2, -3);
    // top lintel
    box(4.5, 0.5, 6, 0x222222, -15, 4.25, -3);

    // ── 6. KING ARTHUR'S GREAT HALLS (1933 Arts & Crafts) ───────────────────
    // main hall building 20×8×14
    box(20, 8, 14, 0x885533, -20, 4, 8);
    // hall roof (shallow gabled — approximated as flat for rules compliance)
    box(21, 1, 15, 0x664422, -20, 8.5, 8);

    // 2 octagonal towers (CylinderGeometry, 8 sides)
    cylinder(3, 3, 12, 8, 0x775533, -10, 6, 6);
    cylinder(3, 3, 12, 8, 0x775533, -30, 6, 6);
    // tower cone caps
    cone(3.2, 4, 8, 0x553311, -10, 14, 6);
    cone(3.2, 4, 8, 0x553311, -30, 14, 6);

    // round table room — smaller box attached to hall
    box(12, 6, 10, 0x996644, -20, 3, 17);

    // ── 7. TINTAGEL VILLAGE ─────────────────────────────────────────────────
    // 8 Cornish slate cottages 5×6×5, 0x777788
    var cottages = [
      [-38, 3, -8],
      [-32, 3, -8],
      [-26, 3, -8],
      [-20, 3, -8],
      [-38, 3, 2],
      [-32, 3, 2],
      [-26, 3, 2],
      [-20, 3, 2]
    ];
    var ci;
    for (ci = 0; ci < cottages.length; ci++) {
      box(5, 6, 5, 0x777788, cottages[ci][0], cottages[ci][1], cottages[ci][2]);
      // slate roof (slightly wider, dark)
      box(5.5, 0.5, 5.5, 0x556677, cottages[ci][0], cottages[ci][1] + 3.25, cottages[ci][2]);
    }

    // ── 8. ROCKY FORESHORE ───────────────────────────────────────────────────
    // 12 jagged slate rock formations 2×8×0.5 at various angles
    var rocks = [
      [-5,  4, 8,  0.3,  0.1, 0],
      [-8,  4, 6,  -0.2, 0.3, 0.15],
      [-3,  4, 12, 0.4,  -0.2, 0],
      [0,   4, 10, -0.3, 0.15, 0.2],
      [3,   4, 7,  0.2,  0.4,  0],
      [-6,  4, 14, 0.35, -0.1, 0.1],
      [5,   4, 9,  -0.25,0.2,  0],
      [-10, 4, 9,  0.15, 0.35, 0],
      [2,   4, 14, 0.4,  -0.3, 0.15],
      [-4,  4, 4,  -0.1, 0.2,  0],
      [7,   4, 11, 0.3,  0.1,  0],
      [-9,  4, 4,  -0.2, 0.4,  0]
    ];
    var ri;
    for (ri = 0; ri < rocks.length; ri++) {
      var r = rocks[ri];
      var geo = new THREE.BoxGeometry(2, 8, 0.5);
      var mat = new THREE.MeshLambertMaterial({ color: 0x444455 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(r[0], r[1], r[2]);
      mesh.rotation.x = r[3];
      mesh.rotation.y = r[4];
      mesh.rotation.z = r[5];
      group.add(mesh);
    }

    // ── 9. CRASHING WAVES ────────────────────────────────────────────────────
    // white sphere clusters at cliff base (island at x=10, base y≈0)
    var wavePositions = [
      [0,  0.4, -8],
      [3,  0.3, -7],
      [-2, 0.5, -8],
      [6,  0.3, -6],
      [16, 0.5, -8],
      [20, 0.4, -7],
      [13, 0.3, -8],
      [10, 0.6, -8],
      [5,  0.4,  8],
      [15, 0.3,  8],
      [10, 0.5,  8]
    ];
    var wi;
    for (wi = 0; wi < wavePositions.length; wi++) {
      var wp = wavePositions[wi];
      sphere(0.5, 0xFFFFFF, wp[0], wp[1], wp[2]);
    }

    scene.add(group);
    return group;
  }

  window.TintagelMerlin = { init: init };

}(window));
