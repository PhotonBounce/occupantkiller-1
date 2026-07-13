window.LandsEndCape = (function () {
  var OX = 8280;
  var OZ = 0;

  function build(scene) {
    cliffs(scene);
    lighthouse(scene);
    armedknight(scene);
    ocean(scene);
    cove(scene);
    complex(scene);
    pub(scene);
    markers(scene);
    tors(scene);
  }

  function box(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    return mesh;
  }

  function cyl(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    return mesh;
  }

  function cone(r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    return mesh;
  }

  function cliffs(scene) {
    var c = 0x777766;
    var sections = [
      [0, 0, 0, 0],
      [22, 0, 3, 0],
      [-22, 0, -2, 0.08],
      [10, 0, -18, -0.06],
      [-12, 0, 15, 0.05]
    ];
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      var m = box(20, 0.3, 16, c, s[0], 0.15, s[1]);
      m.rotation.x = s[2];
      m.rotation.z = s[3];
      scene.add(m);
    }
  }

  function lighthouse(scene) {
    var lx = -120;
    var lz = -80;
    scene.add(box(5, 5, 4, 0x888877, lx, 2.5, lz));
    scene.add(cyl(2.5, 2.5, 22, 12, 0xF5F5F5, lx, 16, lz));
    scene.add(cone(2.5, 4, 12, 0xF5F5F5, lx, 29, lz));
  }

  function armedknight(scene) {
    scene.add(box(6, 16, 4, 0x666655, -40, 8, -30));
  }

  function ocean(scene) {
    scene.add(box(80, 0.3, 40, 0x3366AA, -60, -0.15, -20));
  }

  function cove(scene) {
    scene.add(box(40, 0.3, 15, 0xF4E0A0, 30, 0.15, 20));
    scene.add(box(10, 8, 5, 0x003399, 30, 4, 10));
  }

  function complex(scene) {
    scene.add(box(20, 15, 7, 0x885533, 5, 7.5, 5));
    scene.add(box(0.3, 0.3, 5, 0x8B6914, 16, 2.5, 5));
    scene.add(box(0.3, 0.3, 5, 0x8B6914, 18, 2.5, 5));
    scene.add(box(3, 0.3, 1, 0x8B6914, 17, 4, 5));
    scene.add(box(3, 0.3, 1, 0x8B6914, 17, 3, 5));
  }

  function pub(scene) {
    scene.add(box(10, 8, 7, 0x2D4A1E, -15, 4, 8));
  }

  function markers(scene) {
    var positions = [
      [20, 25], [25, 15], [30, 5], [-5, 22], [-10, 15], [-20, 8]
    ];
    for (var i = 0; i < positions.length; i++) {
      var px = positions[i][0];
      var pz = positions[i][1];
      scene.add(box(0.2, 0.2, 2, 0xFFFFFF, px, 1, pz));
      scene.add(box(0.2, 0.2, 1, 0xFFFFFF, px + 0.6, 1.8, pz));
    }
  }

  function tors(scene) {
    var c = 0x777766;
    var torDefs = [
      { x: -30, z: 10, blocks: [[3, 1.5, 3, 0.75], [2.5, 1.2, 2.5, 2.1], [2, 1.0, 2, 3.2], [1.5, 0.8, 1.5, 4.1]] },
      { x: 35, z: -5, blocks: [[4, 2, 4, 1.0], [3, 1.5, 3, 2.75], [2, 1.2, 2, 4.15]] },
      { x: -50, z: 5, blocks: [[3.5, 1.8, 3.5, 0.9], [2.8, 1.4, 2.8, 2.6], [2, 1.0, 2, 3.9]] },
      { x: 50, z: 18, blocks: [[4, 2.2, 4, 1.1], [3.2, 1.6, 3.2, 3.0], [2.4, 1.2, 2.4, 4.5], [1.6, 0.9, 1.6, 5.45]] }
    ];
    for (var i = 0; i < torDefs.length; i++) {
      var t = torDefs[i];
      for (var j = 0; j < t.blocks.length; j++) {
        var b = t.blocks[j];
        scene.add(box(b[0], b[1], b[2], c, t.x, b[3], t.z));
      }
    }
  }

  return { build: build };
})();
