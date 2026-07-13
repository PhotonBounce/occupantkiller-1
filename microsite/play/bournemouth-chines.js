(function (window) {
  'use strict';

  function build() {
    var group = new THREE.Group();
    var DEG = Math.PI / 180;
    var OX = 7360;
    var OZ = 0;

    // 1. BA i360 Tower
    function tower() {
      var g = new THREE.Group();
      var mastGeo = new THREE.CylinderGeometry(1.5, 1.5, 50, 16);
      var mastMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      var mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.set(0, 25, 0);
      g.add(mast);
      var podGeo = new THREE.CylinderGeometry(5, 5, 4, 24);
      var podMat = new THREE.MeshLambertMaterial({ color: 0x778899 });
      var pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(0, 30, 0);
      g.add(pod);
      g.position.set(OX - 40, 0, OZ + 5);
      return g;
    }

    // 2. Bournemouth Pier
    function pier() {
      var g = new THREE.Group();
      var mat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });

      var approachGeo = new THREE.BoxGeometry(15, 7, 8);
      var approach = new THREE.Mesh(approachGeo, mat);
      approach.position.set(0, 3.5, 0);
      g.add(approach);

      var deckGeo = new THREE.BoxGeometry(3, 0.8, 70);
      var deck = new THREE.Mesh(deckGeo, mat);
      deck.position.set(0, 7, 35);
      g.add(deck);

      var legMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
      var legPositions = [
        [-1, 10], [1, 10],
        [-1, 20], [1, 20],
        [-1, 30], [1, 30],
        [-1, 40], [1, 40],
        [-1, 50], [1, 50],
        [-1, 60], [1, 60]
      ];
      for (var i = 0; i < legPositions.length; i++) {
        var legGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        var leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(legPositions[i][0], 4.5, legPositions[i][1]);
        g.add(leg);
      }

      var pavilionGeo = new THREE.BoxGeometry(18, 7, 10);
      var pavilion = new THREE.Mesh(pavilionGeo, mat);
      pavilion.position.set(0, 3.5, 72);
      g.add(pavilion);

      g.position.set(OX, 0.15, OZ - 10);
      return g;
    }

    // 3. Chines
    function chines() {
      var g = new THREE.Group();
      var mat = new THREE.MeshLambertMaterial({ color: 0x1A3A1A });
      var chineXs = [-25, 0, 25];
      for (var c = 0; c < chineXs.length; c++) {
        var wall1Geo = new THREE.BoxGeometry(0.3, 12, 10);
        var wall1 = new THREE.Mesh(wall1Geo, mat);
        wall1.position.set(chineXs[c] - 5, 6, -5);
        g.add(wall1);
        var wall2Geo = new THREE.BoxGeometry(0.3, 12, 10);
        var wall2 = new THREE.Mesh(wall2Geo, mat);
        wall2.position.set(chineXs[c] + 5, 6, -5);
        g.add(wall2);
      }
      g.position.set(OX - 10, 0, OZ + 40);
      return g;
    }

    // 4. Beach
    function beach() {
      var geo = new THREE.BoxGeometry(80, 0.3, 20);
      var mat = new THREE.MeshLambertMaterial({ color: 0xF4E0A0 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX, 0, OZ - 5);
      return mesh;
    }

    // 5. Sea
    function sea() {
      var geo = new THREE.BoxGeometry(80, 0.3, 25);
      var mat = new THREE.MeshLambertMaterial({ color: 0x4488BB });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX, -0.1, OZ - 22);
      return mesh;
    }

    // 6. Bournemouth International Centre
    function centre() {
      var geo = new THREE.BoxGeometry(40, 25, 10);
      var mat = new THREE.MeshLambertMaterial({ color: 0x778899 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX + 30, 12.5, OZ + 55);
      return mesh;
    }

    // 7. Russell-Cotes Museum
    function museum() {
      var g = new THREE.Group();
      var mat = new THREE.MeshLambertMaterial({ color: 0xF5F0E0 });
      var bodyGeo = new THREE.BoxGeometry(18, 10, 14);
      var body = new THREE.Mesh(bodyGeo, mat);
      body.position.set(0, 5, 0);
      g.add(body);
      var gable1Geo = new THREE.BoxGeometry(6, 4, 1);
      var gable1 = new THREE.Mesh(gable1Geo, mat);
      gable1.position.set(-5, 12, -7);
      g.add(gable1);
      var gable2Geo = new THREE.BoxGeometry(6, 4, 1);
      var gable2 = new THREE.Mesh(gable2Geo, mat);
      gable2.position.set(5, 12, -7);
      g.add(gable2);
      var gable3Geo = new THREE.BoxGeometry(1, 4, 6);
      var gable3 = new THREE.Mesh(gable3Geo, mat);
      gable3.position.set(9, 12, 0);
      g.add(gable3);
      g.position.set(OX - 30, 0, OZ + 50);
      return g;
    }

    // 8. Beach huts
    function huts() {
      var g = new THREE.Group();
      var colors = [
        0xFF4444, 0xFF8800, 0xFFDD00, 0x88DD00,
        0x00CC44, 0x00CCCC, 0x0088FF, 0x4444FF,
        0x8800FF, 0xFF00FF, 0xFF4488, 0xFF8844,
        0xFFCC44, 0x44FF88, 0x44FFCC, 0x44CCFF,
        0xCC44FF, 0xFF44CC
      ];
      for (var i = 0; i < 18; i++) {
        var mat = new THREE.MeshLambertMaterial({ color: colors[i] });
        var bodyGeo = new THREE.BoxGeometry(2.5, 2, 3);
        var body = new THREE.Mesh(bodyGeo, mat);
        body.position.set(0, 1, 0);
        var roofGeo = new THREE.BoxGeometry(2.7, 0.5, 3.2);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x884422 });
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, 2.25, 0);
        var hut = new THREE.Group();
        hut.add(body);
        hut.add(roof);
        hut.position.set(i * 3.5 - 31, 0, OZ + 3);
        hut.position.x += OX;
        g.add(hut);
      }
      return g;
    }

    // 9. East Cliff
    function cliff() {
      var geo = new THREE.BoxGeometry(60, 0.3, 14);
      var mat = new THREE.MeshLambertMaterial({ color: 0xEEEBDA });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX, 0, OZ + 30);
      return mesh;
    }

    group.add(tower());
    group.add(pier());
    group.add(chines());
    group.add(beach());
    group.add(sea());
    group.add(centre());
    group.add(museum());
    group.add(huts());
    group.add(cliff());

    return group;
  }

  window.BournemouthChines = { build: build };

}(window));
