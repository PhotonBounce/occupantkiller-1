window.GretnaPost = (function() {
  'use strict';

  var WX = 2440;
  var WZ = 2200;

  function makebox(scene, w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    scene.add(mesh);
    return mesh;
  }

  function makecylinder(scene, rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    scene.add(mesh);
    return mesh;
  }

  function makesphere(scene, r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    scene.add(mesh);
    return mesh;
  }

  function makecone(scene, r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    scene.add(mesh);
    return mesh;
  }

  function makelines(scene, points, color) {
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: color });
    var line = new THREE.LineSegments(geo, mat);
    scene.add(line);
    return line;
  }

  function buildblacksmithshop(scene) {
    // Main whitewashed building 12x5x8
    makebox(scene, 12, 5, 8, 0xF5F5F5, 0, 2.5, 0);
    // Roof (slightly wider, dark)
    makebox(scene, 13, 0.5, 9, 0x555555, 0, 5.25, 0);
    // Red door
    makebox(scene, 1.5, 3, 0.2, 0xCC0000, -2, 1.5, -4.1);
    // Door frame
    makebox(scene, 1.8, 3.2, 0.15, 0x8B4513, -2, 1.6, -4.2);
    // Window left
    makebox(scene, 1.5, 1.2, 0.2, 0xADD8E6, -4.5, 3, -4.1);
    // Window right
    makebox(scene, 1.5, 1.2, 0.2, 0xADD8E6, 1.5, 3, -4.1);
    // Anvil block base
    makebox(scene, 1.2, 0.8, 0.8, 0x222222, 3, 0.4, -1);
    // Anvil top
    makebox(scene, 1.4, 0.3, 0.6, 0x111111, 3, 0.95, -1);
    // Anvil horn
    makecone(scene, 0.15, 0.8, 6, 0x111111, 3.85, 1.05, -1);
    // Forge chimney cylinder
    makecylinder(scene, 0.4, 0.5, 4, 8, 0x333333, -5, 7, 1);
    // Chimney base box
    makebox(scene, 1.2, 1.5, 1.2, 0x444444, -5, 5.75, 1);
    // Sign above door
    makebox(scene, 3, 0.8, 0.15, 0xD4A97A, -2, 4.1, -4.15);
    // Hitching post
    makecylinder(scene, 0.1, 0.1, 2, 6, 0x5C3317, 6, 1, -2);
    makecylinder(scene, 0.1, 0.1, 2, 6, 0x5C3317, 7.5, 1, -2);
    makebox(scene, 1.7, 0.15, 0.15, 0x5C3317, 6.75, 2, -2);
  }

  function buildbordermarker(scene) {
    // Large stone obelisk
    makebox(scene, 3, 10, 3, 0x9A9A9A, 20, 5, -15);
    // Obelisk top cone
    makecone(scene, 1.8, 3, 8, 0x888888, 20, 11.5, -15);
    // Base plinth
    makebox(scene, 4.5, 1, 4.5, 0x7A7A7A, 20, 0.5, -15);
    // Border line: England side boxes (white)
    makebox(scene, 2, 0.3, 0.8, 0xFFFFFF, 24, 0.15, -15);
    makebox(scene, 2, 0.3, 0.8, 0xFF0000, 26.5, 0.15, -15);
    makebox(scene, 2, 0.3, 0.8, 0xFFFFFF, 29, 0.15, -15);
    makebox(scene, 2, 0.3, 0.8, 0xFF0000, 31.5, 0.15, -15);
    // Border line: Scotland side boxes (blue)
    makebox(scene, 2, 0.3, 0.8, 0x003399, 15.5, 0.15, -15);
    makebox(scene, 2, 0.3, 0.8, 0xFFFFFF, 13, 0.15, -15);
    makebox(scene, 2, 0.3, 0.8, 0x003399, 10.5, 0.15, -15);
    makebox(scene, 2, 0.3, 0.8, 0xFFFFFF, 8, 0.15, -15);
    // England sign
    makebox(scene, 4, 1, 0.2, 0xEEEECC, 27, 2, -15);
    // Scotland sign
    makebox(scene, 4, 1, 0.2, 0xCCEEEE, 12, 2, -15);
    // Sign posts
    makecylinder(scene, 0.1, 0.1, 2.5, 6, 0x555555, 25.5, 1.25, -15);
    makecylinder(scene, 0.1, 0.1, 2.5, 6, 0x555555, 28.5, 1.25, -15);
    makecylinder(scene, 0.1, 0.1, 2.5, 6, 0x555555, 10.5, 1.25, -15);
    makecylinder(scene, 0.1, 0.1, 2.5, 6, 0x555555, 13.5, 1.25, -15);
  }

  function buildsignalbox(scene) {
    // Elevated signal box body
    makebox(scene, 5, 8, 5, 0xD4A97A, -20, 9, 20);
    // Roof
    makebox(scene, 6, 0.6, 6, 0x8B4513, -20, 13.3, 20);
    // Roof overhang detail
    makecone(scene, 3.5, 1.5, 4, 0x7A3B0A, -20, 14.35, 20);
    // Windows (signal box has many)
    makebox(scene, 1.2, 1.5, 0.15, 0xADD8E6, -22, 9.5, 17.4);
    makebox(scene, 1.2, 1.5, 0.15, 0xADD8E6, -20, 9.5, 17.4);
    makebox(scene, 1.2, 1.5, 0.15, 0xADD8E6, -18, 9.5, 17.4);
    makebox(scene, 1.2, 1.5, 0.15, 0xADD8E6, -22, 9.5, 22.6);
    makebox(scene, 1.2, 1.5, 0.15, 0xADD8E6, -20, 9.5, 22.6);
    makebox(scene, 1.2, 1.5, 0.15, 0xADD8E6, -18, 9.5, 22.6);
    // Elevated legs
    makecylinder(scene, 0.3, 0.3, 5, 6, 0x6B4226, -22.5, 2.5, 17.5);
    makecylinder(scene, 0.3, 0.3, 5, 6, 0x6B4226, -17.5, 2.5, 17.5);
    makecylinder(scene, 0.3, 0.3, 5, 6, 0x6B4226, -22.5, 2.5, 22.5);
    makecylinder(scene, 0.3, 0.3, 5, 6, 0x6B4226, -17.5, 2.5, 22.5);
    // Access stairs side
    makebox(scene, 0.8, 0.15, 4, 0x8B4513, -23.5, 3, 20);
    makebox(scene, 0.8, 0.15, 4, 0x8B4513, -23.5, 4, 20);
    makebox(scene, 0.8, 0.15, 4, 0x8B4513, -23.5, 5, 20);
    makebox(scene, 0.8, 0.15, 4, 0x8B4513, -23.5, 6, 20);
    // Platform around signal box
    makebox(scene, 7, 0.3, 7, 0xAA8855, -20, 5.15, 20);
    // Lever frame visible through window (dark iron)
    makebox(scene, 3, 2, 0.5, 0x222233, -20, 8.5, 19.5);
    // Signal arm
    makebox(scene, 2.5, 0.3, 0.3, 0xCC0000, -16, 11, 20);
    makecylinder(scene, 0.15, 0.15, 3, 6, 0x444444, -16, 9.5, 20);
  }

  function buildtrainwreckage(scene) {
    // Derailed locomotive body
    makebox(scene, 8, 3, 3, 0x4A4A4A, -35, 1.5, 30);
    // Locomotive angled (tipped)
    makebox(scene, 6, 2, 2.5, 0x3A3A3A, -43, 2, 29);
    // Boiler cylinder
    makecylinder(scene, 1.2, 1.4, 7, 10, 0x2A2A2A, -39, 2.8, 30);
    // Chimney stack
    makecylinder(scene, 0.4, 0.6, 2.5, 8, 0x1A1A1A, -43.5, 4.5, 30);
    // Smashed carriage 1
    makebox(scene, 7, 2.5, 2.8, 0x4A4A4A, -28, 1.8, 33);
    // Smashed carriage 2 (on its side)
    makebox(scene, 2.8, 7, 2.5, 0x3D3D3D, -25, 2.2, 37);
    // Smashed carriage 3
    makebox(scene, 6, 1.8, 2.6, 0x4A4A4A, -33, 1.5, 36);
    // Debris chunks small
    makebox(scene, 1.5, 1, 1.2, 0x4A4A4A, -30, 0.5, 32);
    makebox(scene, 0.8, 0.6, 1.0, 0x555555, -31.5, 0.3, 34);
    makebox(scene, 1.2, 0.8, 0.9, 0x4A4A4A, -27, 0.4, 35);
    makebox(scene, 0.6, 0.5, 0.7, 0x3A3A3A, -29, 0.25, 37);
    makebox(scene, 1.8, 0.5, 0.6, 0x4A4A4A, -36, 0.25, 33);
    makebox(scene, 1.0, 0.7, 1.1, 0x555555, -24, 0.35, 31);
    makebox(scene, 0.9, 0.6, 0.8, 0x4A4A4A, -38, 0.3, 35);
    // Rail tracks
    makebox(scene, 40, 0.2, 0.3, 0x666666, -25, 0.1, 29.5);
    makebox(scene, 40, 0.2, 0.3, 0x666666, -25, 0.1, 31.5);
    // Sleepers
    makebox(scene, 0.3, 0.25, 3, 0x5C3317, -15, 0.12, 30.5);
    makebox(scene, 0.3, 0.25, 3, 0x5C3317, -18, 0.12, 30.5);
    makebox(scene, 0.3, 0.25, 3, 0x5C3317, -21, 0.12, 30.5);
    makebox(scene, 0.3, 0.25, 3, 0x5C3317, -24, 0.12, 30.5);
    makebox(scene, 0.3, 0.25, 3, 0x5C3317, -27, 0.12, 30.5);
    makebox(scene, 0.3, 0.25, 3, 0x5C3317, -30, 0.12, 30.5);
    // Scattered coal lumps
    makebox(scene, 0.5, 0.3, 0.4, 0x1A1A1A, -40, 0.15, 28);
    makebox(scene, 0.4, 0.25, 0.5, 0x111111, -41, 0.12, 31);
    makebox(scene, 0.6, 0.35, 0.4, 0x1A1A1A, -38, 0.17, 32);
    // Steam dome sphere
    makesphere(scene, 0.7, 8, 6, 0x2A2A2A, -41, 4.2, 30);
    // Wheel remnants
    makecylinder(scene, 1.0, 1.0, 0.3, 12, 0x333333, -32, 1, 31.5);
    makecylinder(scene, 1.0, 1.0, 0.3, 12, 0x333333, -26, 0.8, 33);
  }

  function builddevilsporridge(scene) {
    // Long factory shed 1
    makebox(scene, 30, 4, 8, 0x7A7A7A, 50, 2, -5);
    // Shed 1 roof
    makebox(scene, 31, 0.4, 9, 0x5A5A5A, 50, 4.2, -5);
    // Roof ridge
    makecone(scene, 4.8, 2, 4, 0x5A5A5A, 50, 5.5, -5);
    // Factory shed 2
    makebox(scene, 28, 4, 8, 0x7A7A7A, 50, 2, -17);
    makebox(scene, 29, 0.4, 9, 0x5A5A5A, 50, 4.2, -17);
    makecone(scene, 4.8, 2, 4, 0x5A5A5A, 50, 5.5, -17);
    // Factory shed 3
    makebox(scene, 25, 4, 8, 0x7A7A7A, 49, 2, -29);
    makebox(scene, 26, 0.4, 9, 0x5A5A5A, 49, 4.2, -29);
    // Chimney stacks
    makecylinder(scene, 0.6, 0.8, 8, 8, 0x5A5A5A, 38, 8, -5);
    makecylinder(scene, 0.6, 0.8, 8, 8, 0x5A5A5A, 62, 8, -5);
    makecylinder(scene, 0.6, 0.8, 7, 8, 0x5A5A5A, 40, 7.5, -17);
    // Acid storage tanks (box shaped)
    makebox(scene, 4, 4, 4, 0x8A8A6A, 70, 2, -5);
    makebox(scene, 4, 4, 4, 0x8A8A6A, 70, 2, -11);
    makebox(scene, 4, 4, 4, 0x8A8A6A, 70, 2, -17);
    makebox(scene, 4, 4, 4, 0x8A8A6A, 76, 2, -8);
    makebox(scene, 4, 4, 4, 0x8A8A6A, 76, 2, -14);
    // Tank tops
    makebox(scene, 4.5, 0.4, 4.5, 0x6A6A5A, 70, 4.2, -5);
    makebox(scene, 4.5, 0.4, 4.5, 0x6A6A5A, 70, 4.2, -11);
    makebox(scene, 4.5, 0.4, 4.5, 0x6A6A5A, 70, 4.2, -17);
    // Workers housing row - 6 cottages
    makebox(scene, 5, 4, 6, 0xD4B896, 38, 2, -42);
    makebox(scene, 5, 4, 6, 0xD4B896, 44.5, 2, -42);
    makebox(scene, 5, 4, 6, 0xD4B896, 51, 2, -42);
    makebox(scene, 5, 4, 6, 0xD4B896, 57.5, 2, -42);
    makebox(scene, 5, 4, 6, 0xD4B896, 64, 2, -42);
    makebox(scene, 5, 4, 6, 0xD4B896, 70.5, 2, -42);
    // Cottage roofs
    makecone(scene, 3.8, 2, 4, 0xAA3333, 38, 5, -42);
    makecone(scene, 3.8, 2, 4, 0xAA3333, 44.5, 5, -42);
    makecone(scene, 3.8, 2, 4, 0xAA3333, 51, 5, -42);
    makecone(scene, 3.8, 2, 4, 0xAA3333, 57.5, 5, -42);
    makecone(scene, 3.8, 2, 4, 0xAA3333, 64, 5, -42);
    makecone(scene, 3.8, 2, 4, 0xAA3333, 70.5, 5, -42);
    // Cottage doors
    makebox(scene, 1, 2.2, 0.15, 0x5C3317, 38, 1.1, -45.1);
    makebox(scene, 1, 2.2, 0.15, 0x5C3317, 44.5, 1.1, -45.1);
    makebox(scene, 1, 2.2, 0.15, 0x5C3317, 51, 1.1, -45.1);
    makebox(scene, 1, 2.2, 0.15, 0x5C3317, 57.5, 1.1, -45.1);
    // Perimeter fence posts
    makecylinder(scene, 0.12, 0.12, 2.5, 6, 0x444444, 35, 1.25, 5);
    makecylinder(scene, 0.12, 0.12, 2.5, 6, 0x444444, 42, 1.25, 5);
    makecylinder(scene, 0.12, 0.12, 2.5, 6, 0x444444, 49, 1.25, 5);
    makecylinder(scene, 0.12, 0.12, 2.5, 6, 0x444444, 56, 1.25, 5);
    makecylinder(scene, 0.12, 0.12, 2.5, 6, 0x444444, 63, 1.25, 5);
    makecylinder(scene, 0.12, 0.12, 2.5, 6, 0x444444, 70, 1.25, 5);
    // Fence rails
    makebox(scene, 7, 0.15, 0.15, 0x444444, 38.5, 2, 5);
    makebox(scene, 7, 0.15, 0.15, 0x444444, 45.5, 2, 5);
    makebox(scene, 7, 0.15, 0.15, 0x444444, 52.5, 2, 5);
    makebox(scene, 7, 0.15, 0.15, 0x444444, 59.5, 2, 5);
    makebox(scene, 7, 0.15, 0.15, 0x444444, 66.5, 2, 5);
    // Gatehouse
    makebox(scene, 3, 4, 3, 0x8A8A8A, 35, 2, 0);
    makecone(scene, 2.2, 1.5, 4, 0x5A5A5A, 35, 4.75, 0);
    // Ruined wall section
    makebox(scene, 8, 2, 0.5, 0x8A8A8A, 80, 1, -20);
    makebox(scene, 0.5, 3, 4, 0x8A8A8A, 84, 1.5, -22);
  }

  function buildgroundplane(scene) {
    // Segmented ground tiles to avoid PlaneGeometry
    var i, j;
    for (i = -3; i <= 3; i++) {
      for (j = -3; j <= 3; j++) {
        makebox(scene, 30, 0.1, 30, 0x556B2F, i * 30, -0.05, j * 30);
      }
    }
  }

  function buildroads(scene) {
    // Main road through Gretna
    makebox(scene, 120, 0.12, 6, 0x444444, 10, 0.06, -35);
    // Road markings
    makebox(scene, 8, 0.13, 0.4, 0xFFFFFF, -10, 0.065, -35);
    makebox(scene, 8, 0.13, 0.4, 0xFFFFFF, 2, 0.065, -35);
    makebox(scene, 8, 0.13, 0.4, 0xFFFFFF, 14, 0.065, -35);
    makebox(scene, 8, 0.13, 0.4, 0xFFFFFF, 26, 0.065, -35);
    // Side road to signal box
    makebox(scene, 6, 0.12, 25, 0x444444, -20, 0.06, 7.5);
  }

  function buildtrees(scene) {
    // Scattered trees around site
    var positions = [
      [8, 0, -8],
      [-8, 0, 8],
      [15, 0, 10],
      [-15, 0, -10],
      [5, 0, 18],
      [-5, 0, -18],
      [30, 0, 5],
      [-30, 0, -5]
    ];
    var i;
    for (i = 0; i < positions.length; i++) {
      var px = positions[i][0];
      var py = positions[i][1];
      var pz = positions[i][2];
      // Trunk
      makecylinder(scene, 0.3, 0.4, 3, 6, 0x5C3317, px, 1.5, pz);
      // Foliage
      makecone(scene, 2, 4, 8, 0x228B22, px, 5, pz);
      makecone(scene, 1.5, 3, 8, 0x2E8B57, px, 7, pz);
    }
  }

  function buildmemorial(scene) {
    // Quintinshill memorial stone
    makebox(scene, 2, 3, 0.5, 0x888888, -28, 1.5, 15);
    makebox(scene, 2.5, 0.3, 0.8, 0x777777, -28, 0.15, 15);
    // Wreaths (sphere decorations)
    makesphere(scene, 0.4, 8, 6, 0x228B22, -27.2, 1.5, 14.7);
    makesphere(scene, 0.4, 8, 6, 0x228B22, -28.8, 1.5, 14.7);
    makesphere(scene, 0.3, 8, 6, 0xCC0000, -28, 2.2, 14.7);
  }

  function init(scene) {
    buildgroundplane(scene);
    buildblacksmithshop(scene);
    buildbordermarker(scene);
    buildsignalbox(scene);
    buildtrainwreckage(scene);
    builddevilsporridge(scene);
    buildroads(scene);
    buildtrees(scene);
    buildmemorial(scene);
  }

  return {
    init: init
  };

}());
