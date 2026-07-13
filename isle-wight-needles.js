(function (window) {
  'use strict';

  function build() {
    var group = new THREE.Group();
    group.position.set(7240, 0, 0);

    // 1. The Needles — chalk sea stacks + lighthouse
    function needles() {
      var mat = new THREE.MeshLambertMaterial({ color: 0xFFFAF0 });
      var g = new THREE.Group();

      // Stack 1
      var s1 = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 3), mat);
      s1.position.set(-20, 6, 0);
      s1.rotation.z = 0.18;
      g.add(s1);

      // Stack 2
      var s2 = new THREE.Mesh(new THREE.BoxGeometry(3, 16, 2), mat);
      s2.position.set(-26, 8, 0);
      s2.rotation.z = 0.12;
      g.add(s2);

      // Stack 3
      var s3 = new THREE.Mesh(new THREE.BoxGeometry(2, 22, 2), mat);
      s3.position.set(-33, 11, 0);
      s3.rotation.z = 0.08;
      g.add(s3);

      // Lighthouse base
      var lhMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      var redMat = new THREE.MeshLambertMaterial({ color: 0xFF2222 });
      var lhBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 8, 8), lhMat);
      lhBase.position.set(-37, 4, 0);
      g.add(lhBase);

      // Lighthouse cap
      var lhCap = new THREE.Mesh(new THREE.ConeGeometry(2.5, 3, 8), redMat);
      lhCap.position.set(-37, 9.5, 0);
      g.add(lhCap);

      return g;
    }

    // 2. Chalk cliffs — 3 sections
    function cliffs() {
      var mat = new THREE.MeshLambertMaterial({ color: 0xEEEBDA });
      var g = new THREE.Group();
      var offsets = [-5, 35, 75];
      for (var i = 0; i < 3; i++) {
        var c = new THREE.Mesh(new THREE.BoxGeometry(40, 0.3, 14), mat);
        c.position.set(offsets[i], 0.15, 10);
        c.rotation.x = -Math.PI / 2;
        g.add(c);
      }
      return g;
    }

    // 3. Alum Bay coloured sand cliffs
    function alumBay() {
      var colors = [0xCC4422, 0xDDCC44, 0xFFFAF0, 0x886644, 0x888888];
      var g = new THREE.Group();
      for (var i = 0; i < 5; i++) {
        var mat = new THREE.MeshLambertMaterial({ color: colors[i] });
        var box = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 10), mat);
        box.position.set(10 + i * 9, 0.15, -12);
        box.rotation.x = -Math.PI / 2;
        g.add(box);
      }
      return g;
    }

    // 4. Sea around Needles
    function sea() {
      var mat = new THREE.MeshLambertMaterial({ color: 0x4488BB });
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(80, 0.3, 30), mat);
      mesh.position.set(-20, -0.15, 0);
      return mesh;
    }

    // 5. Yarmouth Castle
    function yarmouthCastle() {
      var mat = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
      var g = new THREE.Group();

      var fort = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 20), mat);
      fort.position.set(80, 2, -20);
      g.add(fort);

      // Corner bastions
      var corners = [
        [70, -10], [90, -10], [70, -30], [90, -30]
      ];
      for (var i = 0; i < corners.length; i++) {
        var b = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 6, 8), mat);
        b.position.set(corners[i][0], 3, corners[i][1]);
        g.add(b);
      }

      return g;
    }

    // 6. Yarmouth harbour
    function harbour() {
      var mat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
      var g = new THREE.Group();

      var arm1 = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 30), mat);
      arm1.position.set(100, 1, -15);
      g.add(arm1);

      var arm2 = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 30), mat);
      arm2.position.set(120, 1, -15);
      g.add(arm2);

      var pier = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 20), mat);
      pier.position.set(110, 0.4, -5);
      g.add(pier);

      return g;
    }

    // 7. Cowes yacht club — Royal Yacht Squadron
    function cowes() {
      var mat = new THREE.MeshLambertMaterial({ color: 0xDDCCAA });
      var cannonMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var g = new THREE.Group();

      var building = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 15), mat);
      building.position.set(60, 4, 40);
      g.add(building);

      // 6 cannons
      var positions = [
        [52, 0, 35], [56, 0, 35], [60, 0, 35],
        [64, 0, 35], [68, 0, 35], [72, 0, 35]
      ];
      for (var i = 0; i < 6; i++) {
        var cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2, 6), cannonMat);
        cannon.position.set(positions[i][0], positions[i][1] + 1, positions[i][2]);
        cannon.rotation.z = Math.PI / 2;
        g.add(cannon);
      }

      return g;
    }

    // 8. Carisbrooke Castle
    function carisbrooke() {
      var mat = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
      var g = new THREE.Group();

      // Mound — 3 stacked boxes
      var mound1 = new THREE.Mesh(new THREE.BoxGeometry(30, 3, 30), mat);
      mound1.position.set(40, 1.5, 60);
      g.add(mound1);

      var mound2 = new THREE.Mesh(new THREE.BoxGeometry(22, 3, 22), mat);
      mound2.position.set(40, 4.5, 60);
      g.add(mound2);

      var mound3 = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 16), mat);
      mound3.position.set(40, 7.5, 60);
      g.add(mound3);

      // Keep on top of mound
      var keep = new THREE.Mesh(new THREE.BoxGeometry(12, 14, 12), mat);
      keep.position.set(40, 16, 60);
      g.add(keep);

      // Round towers
      var towerPositions = [
        [34, 54], [46, 54], [34, 66], [46, 66]
      ];
      for (var i = 0; i < towerPositions.length; i++) {
        var tower = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 16, 8), mat);
        tower.position.set(towerPositions[i][0], 8, towerPositions[i][1]);
        g.add(tower);
      }

      return g;
    }

    group.add(needles());
    group.add(cliffs());
    group.add(alumBay());
    group.add(sea());
    group.add(yarmouthCastle());
    group.add(harbour());
    group.add(cowes());
    group.add(carisbrooke());

    return group;
  }

  window.IsleWightNeedles = { build: build };

})(typeof window !== 'undefined' ? window : global);
