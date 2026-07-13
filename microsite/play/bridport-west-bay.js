var BridportWestBay = (function () {
  var OX = 7560;
  var OZ = 0;

  function group() {
    return new THREE.Group();
  }

  function box(w, h, d) {
    return new THREE.BoxGeometry(w, h, d);
  }

  function cylinder(rt, rb, h, seg) {
    return new THREE.CylinderGeometry(rt, rb, h, seg);
  }

  function sphere(r, ws, hs) {
    return new THREE.SphereGeometry(r, ws, hs);
  }

  function cone(r, h, seg) {
    return new THREE.ConeGeometry(r, h, seg);
  }

  function lambert(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function mesh(geo, mat) {
    return new THREE.Mesh(geo, mat);
  }

  function place(obj, x, y, z) {
    obj.position.set(OX + x, y, OZ + z);
    return obj;
  }

  function harbour() {
    var g = group();

    var cliffMat = lambert(0xCC8844);
    var cliff1 = mesh(box(15, 0.3, 20), cliffMat);
    place(cliff1, -12, 16, 0);
    g.add(cliff1);

    var cliff2 = mesh(box(15, 0.3, 20), cliffMat);
    place(cliff2, 12, 16, 0);
    g.add(cliff2);

    var wallMat = lambert(0xBBAA88);
    var wall1 = mesh(box(4, 2, 30), wallMat);
    place(wall1, -3, 1, 5);
    g.add(wall1);

    var wall2 = mesh(box(4, 2, 30), wallMat);
    place(wall2, 3, 1, 5);
    g.add(wall2);

    var waterMat = lambert(0x336688);
    var water = mesh(box(20, 0.3, 15), waterMat);
    place(water, 0, 0, 10);
    g.add(water);

    return g;
  }

  function goldenCap() {
    var g = group();

    var baseMat = lambert(0x8B3A2A);
    var capMat = lambert(0xCC8844);

    var widths = [30, 24, 18, 12, 6];
    var heights = [4, 4, 4, 4, 4];
    var mats = [baseMat, baseMat, baseMat, capMat, capMat];

    var y = 2;
    for (var i = 0; i < 5; i++) {
      var b = mesh(box(widths[i], heights[i], widths[i]), mats[i]);
      place(b, 100, y, -80);
      g.add(b);
      y += heights[i];
    }

    return g;
  }

  function town() {
    var g = group();

    var buildMat = lambert(0xF0EDE0);
    var roofMat = lambert(0x886655);

    for (var i = 0; i < 10; i++) {
      var bx = -40 + i * 10;
      var b = mesh(box(5, 7, 8), buildMat);
      place(b, bx, 3.5, -40);
      g.add(b);

      var r = mesh(cone(3.5, 3, 4), roofMat);
      place(r, bx, 8.5, -40);
      g.add(r);
    }

    var ropeMat = lambert(0x885533);
    var rope = mesh(box(20, 12, 6), ropeMat);
    place(rope, 10, 6, -55);
    g.add(rope);

    return g;
  }

  function eype() {
    var g = group();

    var shingleMat = lambert(0x888877);
    var shingle = mesh(box(40, 0.3, 10), shingleMat);
    place(shingle, 60, 0, 30);
    g.add(shingle);

    var seaMat = lambert(0x4488BB);
    var sea = mesh(box(40, 0.3, 15), seaMat);
    place(sea, 60, -0.1, 42);
    g.add(sea);

    return g;
  }

  function huts() {
    var g = group();

    var colors = [0xFF4444, 0x44BB44, 0x4444FF, 0xFFFF44, 0xFF44FF, 0x44FFFF, 0xFF8844, 0x8844FF];

    for (var i = 0; i < 8; i++) {
      var hutMat = lambert(colors[i]);
      var h = mesh(box(2.5, 2, 3), hutMat);
      place(h, -30 + i * 4, 1, 25);
      g.add(h);

      var roofMat = lambert(0xCC3333);
      var r = mesh(cone(2, 1.5, 4), roofMat);
      place(r, -30 + i * 4, 2.75, 25);
      g.add(r);
    }

    return g;
  }

  function church() {
    var g = group();

    var churchMat = lambert(0xCCBBAA);

    var body = mesh(box(14, 10, 7), churchMat);
    place(body, -10, 5, -20);
    g.add(body);

    var tower = mesh(box(4, 12, 4), churchMat);
    place(tower, -18, 6, -20);
    g.add(tower);

    var spire = mesh(cone(2, 4, 4), lambert(0xAA9988));
    place(spire, -18, 13, -20);
    g.add(spire);

    return g;
  }

  function chideock() {
    var g = group();

    var cobMat = lambert(0xF5EDD0);
    var thatchMat = lambert(0xBBA020);

    for (var i = 0; i < 6; i++) {
      var cx = 50 + i * 9;

      var cottage = mesh(box(5, 4, 5), cobMat);
      place(cottage, cx, 2, -60);
      g.add(cottage);

      var thatch = mesh(cone(4, 3, 8), thatchMat);
      place(thatch, cx, 5.5, -60);
      g.add(thatch);
    }

    return g;
  }

  function build(scene) {
    scene.add(harbour());
    scene.add(goldenCap());
    scene.add(town());
    scene.add(eype());
    scene.add(huts());
    scene.add(church());
    scene.add(chideock());
  }

  return { build: build };
})();

window.BridportWestBay = BridportWestBay;
