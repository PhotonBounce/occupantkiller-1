var SouthamptonDocks2 = (function () {
  'use strict';

  function build(scene, worldX, worldZ) {
    var group = new THREE.Group();
    group.position.set(worldX, 0, worldZ);
    scene.add(group);

    cranes(group);
    containers(group);
    marina(group);
    memorial(group);
    walls(group);
    terminal(group);
    water(group);
    clocktower(group);
  }

  function mesh(geo, mat) {
    return new THREE.Mesh(geo, mat);
  }

  function lambert(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function cranes(group) {
    var yellow = lambert(0xFFCC00);
    var positions = [
      [-60, 0, -30],
      [-30, 0, -30],
      [0,   0, -30],
      [30,  0, -30]
    ];
    for (var i = 0; i < positions.length; i++) {
      var px = positions[i][0];
      var py = positions[i][1];
      var pz = positions[i][2];

      var tower = mesh(new THREE.BoxGeometry(3, 25, 3), yellow);
      tower.position.set(px, 12.5, pz);
      group.add(tower);

      var boom = mesh(new THREE.BoxGeometry(40, 3, 3), yellow);
      boom.position.set(px + 10, 26, pz);
      group.add(boom);
    }
  }

  function containers(group) {
    var colors = [0x4422AA, 0xCC4422, 0x22AA44, 0x888833];
    var count = 0;
    for (var row = 0; row < 10; row++) {
      for (var col = 0; col < 3; col++) {
        var color = colors[(row + col) % colors.length];
        var mat = lambert(color);
        for (var stack = 0; stack < 3; stack++) {
          var c = mesh(new THREE.BoxGeometry(6, 2.5, 2.5), mat);
          c.position.set(
            -80 + row * 8,
            1.25 + stack * 2.5,
            10 + col * 5
          );
          group.add(c);
        }
        count++;
      }
    }
  }

  function marina(group) {
    var mastMat = lambert(0xDDDDCC);
    var hullMat = lambert(0xFFFFFF);
    for (var i = 0; i < 10; i++) {
      var bx = 50 + i * 10;
      var bz = 20;

      var hull = mesh(new THREE.BoxGeometry(8, 1, 2.5), hullMat);
      hull.position.set(bx, 0.5, bz);
      group.add(hull);

      var mast = mesh(new THREE.CylinderGeometry(0.2, 0.2, 12, 6), mastMat);
      mast.position.set(bx, 7, bz);
      group.add(mast);
    }
  }

  function memorial(group) {
    var stone = lambert(0xCCCCBB);

    var col = mesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 12), stone);
    col.position.set(0, 4, 40);
    group.add(col);

    var globe = mesh(new THREE.SphereGeometry(2, 12, 12), stone);
    globe.position.set(0, 10, 40);
    group.add(globe);
  }

  function walls(group) {
    var stone = lambert(0xBBAA88);

    var t1 = mesh(new THREE.BoxGeometry(5, 12, 5), stone);
    t1.position.set(20, 6, 60);
    group.add(t1);

    var t2 = mesh(new THREE.BoxGeometry(5, 12, 5), stone);
    t2.position.set(26, 6, 60);
    group.add(t2);

    var arch = mesh(new THREE.BoxGeometry(6, 3, 5), stone);
    arch.position.set(23, 10.5, 60);
    group.add(arch);
  }

  function terminal(group) {
    var mat = lambert(0x8B6914);
    var shed = mesh(new THREE.BoxGeometry(80, 8, 20), mat);
    shed.position.set(-20, 4, -50);
    group.add(shed);

    var roofMat = lambert(0x7A5C10);
    for (var i = 0; i < 5; i++) {
      var berth = mesh(new THREE.BoxGeometry(12, 4, 8), roofMat);
      berth.position.set(-50 + i * 16, 10, -50);
      group.add(berth);
    }
  }

  function water(group) {
    var mat = lambert(0x336688);
    var w = mesh(new THREE.BoxGeometry(80, 0.3, 20), mat);
    w.position.set(0, -0.15, 0);
    group.add(w);
  }

  function clocktower(group) {
    var art = lambert(0xF0EDE0);

    var tower = mesh(new THREE.BoxGeometry(8, 30, 8), art);
    tower.position.set(60, 15, 50);
    group.add(tower);

    var face1 = mesh(new THREE.BoxGeometry(8.2, 4, 1), art);
    face1.position.set(60, 28, 45.5);
    group.add(face1);

    var face2 = mesh(new THREE.BoxGeometry(8.2, 4, 1), art);
    face2.position.set(60, 28, 54.5);
    group.add(face2);

    var face3 = mesh(new THREE.BoxGeometry(1, 4, 8.2), art);
    face3.position.set(55.5, 28, 50);
    group.add(face3);

    var face4 = mesh(new THREE.BoxGeometry(1, 4, 8.2), art);
    face4.position.set(64.5, 28, 50);
    group.add(face4);

    var cap = mesh(new THREE.ConeGeometry(6, 6, 4), art);
    cap.position.set(60, 33, 50);
    group.add(cap);
  }

  function init(scene) {
    build(scene, 7160, 0);
  }

  window.SouthamptonDocks2 = { init: init };
  return window.SouthamptonDocks2;
})();
