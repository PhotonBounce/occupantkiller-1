(function (window) {
  'use strict';

  window.BarnstapleBridge = function (scene) {
    var OX = 7760;
    var OZ = 0;

    function box(w, h, d, color, x, y, z) {
      var geo = new THREE.BoxGeometry(w, h, d);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    function cylinder(rt, rb, h, color, x, y, z, rx, rz) {
      var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX + x, y, OZ + z);
      if (rx) mesh.rotation.x = rx;
      if (rz) mesh.rotation.z = rz;
      scene.add(mesh);
      return mesh;
    }

    function sphere(r, color, x, y, z) {
      var geo = new THREE.SphereGeometry(r, 8, 8);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    function cone(r, h, color, x, y, z, rx, rz) {
      var geo = new THREE.ConeGeometry(r, h, 8);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX + x, y, OZ + z);
      if (rx) mesh.rotation.x = rx;
      if (rz) mesh.rotation.z = rz;
      scene.add(mesh);
      return mesh;
    }

    function lines(points, color) {
      var geo = new THREE.BufferGeometry().setFromPoints(points);
      var mat = new THREE.LineBasicMaterial({ color: color });
      var seg = new THREE.LineSegments(geo, mat);
      seg.position.set(OX, 0, OZ);
      scene.add(seg);
      return seg;
    }

    // 1) Long Bridge — 16-arch medieval bridge
    // Bridge deck 50x1x4 centered near river crossing
    box(50, 1, 4, 0xBBAA88, 0, 1, 5);
    // 16 pier boxes 2x8x2 spaced along the deck
    for (var i = 0; i < 16; i++) {
      var px = -23 + i * 3;
      box(2, 8, 2, 0xBBAA88, px, -3, 5);
    }

    // 2) Pannier Market — Victorian covered market
    // Main hall 30x8x20
    box(30, 8, 20, 0x885533, -60, 4, -30);
    // 5 iron arch ribs as thin cylinders arching over the roof
    for (var j = 0; j < 5; j++) {
      var rx2 = -60 + (-8 + j * 4);
      cylinder(0.2, 0.2, 22, 0x444444, rx2, 9, -30, Math.PI / 2.2, 0);
    }

    // 3) St Peter's Church — nave + tower + tilted spire
    // Nave 20x9x12
    box(20, 9, 12, 0xBBB8A0, -30, 4.5, -55);
    // Tower 5x16x5
    box(5, 16, 5, 0xBBB8A0, -18, 8, -55);
    // ConeGeometry spire 4r x 10 tilted (crooked lead spire)
    cone(4, 10, 0xBBB8A0, -18, 21, -55, 0, 0.18);

    // 4) River Taw estuary — flat water plane 80x0.3x15
    box(80, 0.3, 15, 0x336688, 0, 0.15, 10);

    // 5) Braunton Burrows dunes — 8 sand dunes in rolling pattern
    var dunePositions = [
      [40, 18], [46, 22], [52, 16], [58, 20],
      [43, 28], [49, 24], [55, 28], [61, 24]
    ];
    for (var k = 0; k < dunePositions.length; k++) {
      sphere(3, 0xEECC88, dunePositions[k][0], 1.5, dunePositions[k][1]);
    }

    // 6) Barnstaple town centre — 12 Georgian buildings
    var wallColor = 0xF0EDE0;
    var roofColor = 0x9B3A2A;
    for (var b = 0; b < 12; b++) {
      var col = b < 6 ? 0 : 1;
      var row = b % 6;
      var bx = -80 + row * 8;
      var bz = -15 + col * 15;
      box(5, 8, 7, wallColor, bx, 4, bz);
      // pitched roof as a thin box
      box(5, 1, 7, roofColor, bx, 8.5, bz);
    }

    // 7) North Devon Museum — 14x7x10
    box(14, 7, 10, 0x885533, -45, 3.5, -45);

    // 8) Tarka Trail cycle path — 60x0.3x2
    box(60, 0.3, 2, 0x8B6914, 20, 0.15, -5);
  };

}(window));
