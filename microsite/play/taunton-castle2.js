var TauntonCastle2 = (function () {
  var OX = 7640;
  var OZ = 0;

  function box(w, h, d) {
    return new THREE.BoxGeometry(w, h, d);
  }

  function cyl(rt, rb, h, segs) {
    return new THREE.CylinderGeometry(rt, rb, h, segs || 16);
  }

  function sphere(r, ws, hs) {
    return new THREE.SphereGeometry(r, ws || 8, hs || 8);
  }

  function cone(r, h, segs) {
    return new THREE.ConeGeometry(r, h, segs || 8);
  }

  function mat(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function mesh(geo, mtl) {
    return new THREE.Mesh(geo, mtl);
  }

  function place(m, x, y, z, scene) {
    m.position.set(OX + x, y, OZ + z);
    scene.add(m);
    return m;
  }

  function castle(scene) {
    var keepMat = mat(0xCC9966);
    var hallMat = mat(0xBBAA88);
    var keep = mesh(box(15, 12, 12), keepMat);
    place(keep, 0, 6, 0, scene);
    var hall = mesh(box(25, 8, 15), hallMat);
    place(hall, 20, 4, 0, scene);
    var gate = mesh(box(8, 12, 8), keepMat);
    place(gate, 36, 6, 0, scene);
    var tower1 = mesh(cyl(3, 3, 14), keepMat);
    place(tower1, 36, 7, 6, scene);
    var tower2 = mesh(cyl(3, 3, 14), keepMat);
    place(tower2, 36, 7, -6, scene);
  }

  function church(scene) {
    var stone = mat(0xAA4422);
    var nave = mesh(box(20, 10, 14), stone);
    place(nave, -30, 5, 40, scene);
    var tower = mesh(box(6, 24, 6), stone);
    place(tower, -40, 12, 40, scene);
    var cap = mesh(cone(5, 8, 8), stone);
    place(cap, -40, 28, 40, scene);
  }

  function cricket(scene) {
    var pavMat = mat(0xF5F0E0);
    var standMat = mat(0x778899);
    var pavilion = mesh(box(25, 8, 15), pavMat);
    place(pavilion, -60, 4, 80, scene);
    var s1 = mesh(box(30, 6, 8), standMat);
    place(s1, -60, 3, 100, scene);
    var s2 = mesh(box(30, 6, 8), standMat);
    place(s2, -60, 3, 60, scene);
    var s3 = mesh(box(8, 6, 30), standMat);
    place(s3, -80, 3, 80, scene);
    var s4 = mesh(box(8, 6, 30), standMat);
    place(s4, -40, 3, 80, scene);
  }

  function river(scene) {
    var waterMat = mat(0x4477AA);
    var tone = mesh(box(60, 0.3, 8), waterMat);
    place(tone, -20, 0.15, 20, scene);
  }

  function orchards(scene) {
    var foliage = mat(0x2D6A1A);
    var trunk = mat(0x5A3A1A);
    var positions = [
      [60, -20], [70, -10], [80, -20], [90, -10],
      [60, -40], [70, -30], [80, -40], [90, -30]
    ];
    for (var i = 0; i < positions.length; i++) {
      var px = positions[i][0];
      var pz = positions[i][1];
      var trunkM = mesh(cyl(0.5, 0.5, 4), trunk);
      place(trunkM, px, 2, pz, scene);
      var leaves = mesh(sphere(2.5, 8, 8), foliage);
      place(leaves, px, 6, pz, scene);
    }
  }

  function towncentre(scene) {
    var colours = [0xF0EDE0, 0x885533];
    var positions = [
      [10, 60], [20, 60], [30, 60], [40, 60],
      [10, 70], [20, 70], [30, 70], [40, 70],
      [10, 80], [20, 80], [30, 80], [40, 80]
    ];
    for (var i = 0; i < positions.length; i++) {
      var c = colours[i % 2];
      var b = mesh(box(5, 8, 7), mat(c));
      place(b, positions[i][0], 4, positions[i][1], scene);
    }
  }

  function hospital(scene) {
    var nhsMat = mat(0x889988);
    var main = mesh(box(50, 8, 20), nhsMat);
    place(main, -80, 4, -60, scene);
    var tower = mesh(box(10, 22, 10), nhsMat);
    place(tower, -60, 11, -60, scene);
  }

  function motorway(scene) {
    var tarmac = mat(0x333333);
    var gantryMat = mat(0x888888);
    var s1 = mesh(box(30, 0.3, 8), tarmac);
    place(s1, 50, 0.15, -80, scene);
    var s2 = mesh(box(30, 0.3, 8), tarmac);
    place(s2, 80, 0.15, -80, scene);
    var s3 = mesh(box(30, 0.3, 8), tarmac);
    place(s3, 110, 0.15, -80, scene);
    var gpost1 = mesh(box(0.5, 8, 0.5), gantryMat);
    place(gpost1, 65, 4, -76, scene);
    var gpost2 = mesh(box(0.5, 8, 0.5), gantryMat);
    place(gpost2, 65, 4, -84, scene);
    var gbeam = mesh(box(12, 0.5, 0.5), gantryMat);
    place(gbeam, 65, 8, -80, scene);
    var gpost3 = mesh(box(0.5, 8, 0.5), gantryMat);
    place(gpost3, 95, 4, -76, scene);
    var gpost4 = mesh(box(0.5, 8, 0.5), gantryMat);
    place(gpost4, 95, 4, -84, scene);
    var gbeam2 = mesh(box(12, 0.5, 0.5), gantryMat);
    place(gbeam2, 95, 8, -80, scene);
  }

  function build(scene) {
    castle(scene);
    church(scene);
    cricket(scene);
    river(scene);
    orchards(scene);
    towncentre(scene);
    hospital(scene);
    motorway(scene);
  }

  return { build: build };
})();

if (typeof module !== 'undefined') { module.exports = TauntonCastle2; }
