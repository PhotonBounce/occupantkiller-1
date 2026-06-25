(function (window) {
  window.PortsmouthSpinnaker = function (scene) {
    var OX = 7080;
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

    function harbour() {
      var m = box(80, 0.3, 20, 0x336688);
      place(m, 0, 0, 0);
    }

    function solent() {
      var m = box(80, 0.3, 30, 0x4488BB);
      place(m, 0, -0.1, -25);
    }

    function spinnaker() {
      var white = 0xF8F8F8;

      var pylonL = box(4, 50, 4, white);
      pylonL.rotation.z = 0.18;
      place(pylonL, -4, 25, 30);

      var pylonR = box(4, 50, 4, white);
      pylonR.rotation.z = -0.18;
      place(pylonR, 4, 25, 30);

      var cross = box(20, 4, 4, white);
      place(cross, 0, 50, 30);

      var capL = box(4, 4, 4, white);
      place(capL, -10, 52, 30);

      var capR = box(4, 4, 4, white);
      place(capR, 10, 52, 30);

      var peak = box(3, 10, 3, white);
      place(peak, 0, 57, 30);
    }

    function gunwharf() {
      var brick = box(50, 8, 20, 0x885533);
      place(brick, 0, 4, 10);

      var atrium = box(20, 10, 10, 0x88AACC);
      place(atrium, 10, 5, 5);

      var atrium2 = box(12, 8, 8, 0x88AACC);
      place(atrium2, -15, 4, 4);
    }

    function victory() {
      var oak = 0x8B6914;
      var black = 0x111111;

      var hull = box(40, 6, 10, oak);
      place(hull, 20, 3, -5);

      var deck = box(38, 1.5, 8, oak);
      place(deck, 20, 6.75, -5);

      var i;
      for (i = 0; i < 10; i++) {
        var portL = box(2, 1, 0.5, black);
        place(portL, 2 + i * 4 - 18, 4, -10.1);
        var portR = box(2, 1, 0.5, black);
        place(portR, 2 + i * 4 - 18, 4, 0.1);
      }

      for (i = 0; i < 8; i++) {
        var portL2 = box(2, 1, 0.5, black);
        place(portL2, 4 + i * 4 - 18, 2, -10.1);
        var portR2 = box(2, 1, 0.5, black);
        place(portR2, 4 + i * 4 - 18, 2, 0.1);
      }

      var mastX = [10, 20, 32];
      for (i = 0; i < 3; i++) {
        var mast = cylinder(0.5, 0.5, 20, 6, oak);
        place(mast, mastX[i], 17, -5);
      }

      var yard1 = box(18, 0.8, 0.8, oak);
      place(yard1, 10, 22, -5);
      var yard2 = box(16, 0.8, 0.8, oak);
      place(yard2, 20, 22, -5);
      var yard3 = box(14, 0.8, 0.8, oak);
      place(yard3, 32, 22, -5);

      var bowsprit = box(14, 0.8, 0.8, oak);
      bowsprit.rotation.z = -0.3;
      place(bowsprit, -3, 9, -5);
    }

    function dockyards() {
      var i;
      for (i = 0; i < 3; i++) {
        var bldg = box(30, 8, 15, 0x885533);
        place(bldg, -20 + i * 16, 4, -18);
      }

      var dock = box(30, 1, 12, 0x556644);
      place(dock, -20, 0.5, -32);
    }

    function gosport() {
      var terminal = box(10, 4, 6, 0x8B6914);
      place(terminal, -35, 2, 5);

      var jetty = box(3, 0.8, 20, 0x8B6914);
      place(jetty, -35, 0.4, -5);
    }

    function southsea() {
      var stone = 0xCC9966;
      var angles = [0, 72, 144, 216, 288];
      var i;
      for (i = 0; i < 5; i++) {
        var a = (angles[i] * Math.PI) / 180;
        var bastion = cylinder(4, 4, 6, 8, stone);
        var bx = Math.cos(a) * 12;
        var bz = Math.sin(a) * 12;
        place(bastion, bx - 30, 3, bz - 40);
      }

      var wall1 = box(20, 4, 3, stone);
      place(wall1, -30, 2, -40);
      var wall2 = box(3, 4, 20, stone);
      place(wall2, -30, 2, -40);
      var centre = box(14, 5, 14, stone);
      place(centre, -30, 2.5, -40);
    }

    harbour();
    solent();
    spinnaker();
    gunwharf();
    victory();
    dockyards();
    gosport();
    southsea();
  };
})(window);
