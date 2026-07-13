(function (window) {
  window.HartlandAbbey = function (scene) {
    var X = 7840;
    var Z = 0;

    function abbey() {
      var mainGeo = new THREE.BoxGeometry(40, 10, 18);
      var mainMat = new THREE.MeshLambertMaterial({ color: 0xF5F5F0 });
      var main = new THREE.Mesh(mainGeo, mainMat);
      main.position.set(X, 5, Z);
      scene.add(main);

      var winMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
      var winPositions = [-15, -5, 5, 15];
      for (var i = 0; i < winPositions.length; i++) {
        var winGeo = new THREE.BoxGeometry(0.8, 5, 0.3);
        var win = new THREE.Mesh(winGeo, winMat);
        win.position.set(X + winPositions[i], 7, Z - 9.2);
        scene.add(win);
        var win2 = new THREE.Mesh(winGeo, winMat);
        win2.position.set(X + winPositions[i], 7, Z + 9.2);
        scene.add(win2);
      }

      var turretMat = new THREE.MeshLambertMaterial({ color: 0xF5F5F0 });
      var turretGeo = new THREE.CylinderGeometry(2, 2, 14, 8);
      var t1 = new THREE.Mesh(turretGeo, turretMat);
      t1.position.set(X - 20, 7, Z - 9);
      scene.add(t1);
      var t2 = new THREE.Mesh(turretGeo, turretMat);
      t2.position.set(X + 20, 7, Z - 9);
      scene.add(t2);
      var t3 = new THREE.Mesh(turretGeo, turretMat);
      t3.position.set(X - 20, 7, Z + 9);
      scene.add(t3);
      var t4 = new THREE.Mesh(turretGeo, turretMat);
      t4.position.set(X + 20, 7, Z + 9);
      scene.add(t4);
    }

    function lighthouse() {
      var towerGeo = new THREE.CylinderGeometry(3, 3, 22, 12);
      var towerMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      var tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(X - 120, 11, Z - 80);
      scene.add(tower);

      var capGeo = new THREE.ConeGeometry(3.5, 4, 12);
      var capMat = new THREE.MeshLambertMaterial({ color: 0xCC2222 });
      var cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(X - 120, 24, Z - 80);
      scene.add(cap);

      var fogGeo = new THREE.BoxGeometry(8, 5, 6);
      var fogMat = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
      var fog = new THREE.Mesh(fogGeo, fogMat);
      fog.position.set(X - 110, 2.5, Z - 80);
      scene.add(fog);
    }

    function cliffs() {
      var cliffMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
      var cliffData = [
        { x: X - 80, z: Z - 60, rx: 0.3 },
        { x: X - 50, z: Z - 90, rx: 0.25 },
        { x: X - 110, z: Z - 40, rx: 0.35 }
      ];
      for (var i = 0; i < cliffData.length; i++) {
        var cGeo = new THREE.BoxGeometry(30, 0.3, 18);
        var cliff = new THREE.Mesh(cGeo, cliffMat);
        cliff.position.set(cliffData[i].x, 8, cliffData[i].z);
        cliff.rotation.x = cliffData[i].rx;
        cliff.rotation.z = 0.15 * (i % 2 === 0 ? 1 : -1);
        scene.add(cliff);
      }
    }

    function rocks() {
      var rockMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
      var rockOffsets = [
        [-30, -50], [10, -55], [-60, -45], [20, -65], [-45, -70],
        [5, -40], [-20, -75], [35, -50], [-70, -55], [15, -80]
      ];
      for (var i = 0; i < rockOffsets.length; i++) {
        var rx = X + rockOffsets[i][0];
        var rz = Z + rockOffsets[i][1];
        var layers = 3 + (i % 2);
        for (var j = 0; j < layers; j++) {
          var sz = 2 + Math.sin(i * 3 + j) * 0.8;
          var sy = 1.2 + Math.cos(i + j) * 0.4;
          var rGeo = new THREE.BoxGeometry(sz, sy, sz * 0.9);
          var rock = new THREE.Mesh(rGeo, rockMat);
          rock.position.set(rx + j * 0.3, sy * 0.5 + j * 1.1, rz + j * 0.2);
          scene.add(rock);
        }
      }
    }

    function cove() {
      var beachGeo = new THREE.BoxGeometry(20, 0.3, 10);
      var beachMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
      var beach = new THREE.Mesh(beachGeo, beachMat);
      beach.position.set(X - 40, 0.15, Z + 60);
      scene.add(beach);

      var caveGeo = new THREE.BoxGeometry(4, 4, 6);
      var caveMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var cave = new THREE.Mesh(caveGeo, caveMat);
      cave.position.set(X - 50, 2, Z + 60);
      scene.add(cave);
    }

    function village() {
      var cottageMat = new THREE.MeshLambertMaterial({ color: 0xF5EDD0 });
      var roofMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
      var positions = [
        [50, 30], [60, 40], [70, 28], [80, 38], [90, 30], [100, 42]
      ];
      for (var i = 0; i < positions.length; i++) {
        var cx = X + positions[i][0];
        var cz = Z + positions[i][1];
        var bodyGeo = new THREE.BoxGeometry(5, 6, 5);
        var body = new THREE.Mesh(bodyGeo, cottageMat);
        body.position.set(cx, 3, cz);
        scene.add(body);

        var roofGeo = new THREE.ConeGeometry(4, 3, 4);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(cx, 7.5, cz);
        roof.rotation.y = Math.PI / 4;
        scene.add(roof);
      }
    }

    function church() {
      var towerGeo = new THREE.BoxGeometry(4, 18, 4);
      var towerMat = new THREE.MeshLambertMaterial({ color: 0xBBB8A0 });
      var tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(X + 30, 9, Z + 50);
      scene.add(tower);

      var capGeo = new THREE.ConeGeometry(3, 4, 4);
      var capMat = new THREE.MeshLambertMaterial({ color: 0x999988 });
      var cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(X + 30, 20, Z + 50);
      cap.rotation.y = Math.PI / 4;
      scene.add(cap);

      var naveGeo = new THREE.BoxGeometry(16, 8, 7);
      var nave = new THREE.Mesh(naveGeo, towerMat);
      nave.position.set(X + 22, 4, Z + 50);
      scene.add(nave);
    }

    abbey();
    lighthouse();
    cliffs();
    rocks();
    cove();
    village();
    church();
  };
}(window));
