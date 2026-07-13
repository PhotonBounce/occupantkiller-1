(function () {
  'use strict';

  window.BidefordCobbled = function (scene) {
    var OX = 7800;
    var OZ = 0;

    function bridge() {
      var mat = new THREE.MeshLambertMaterial({ color: 0xBBAA88 });
      var i;
      for (i = 0; i < 24; i++) {
        var pierGeo = new THREE.BoxGeometry(1.5, 6, 2);
        var pier = new THREE.Mesh(pierGeo, mat);
        pier.position.set(OX + (i * 2.5) - 29, 3, OZ);
        scene.add(pier);
      }
      var deckGeo = new THREE.BoxGeometry(60, 1, 4);
      var deck = new THREE.Mesh(deckGeo, mat);
      deck.position.set(OX, 6.5, OZ);
      scene.add(deck);
    }

    function quay() {
      var mat = new THREE.MeshLambertMaterial({ color: 0xAA9988 });
      var wallGeo = new THREE.BoxGeometry(60, 0.5, 3);
      var wall = new THREE.Mesh(wallGeo, mat);
      wall.position.set(OX, 0.25, OZ + 20);
      scene.add(wall);

      var boatMat = new THREE.MeshLambertMaterial({ color: 0x886655 });
      var i;
      for (i = 0; i < 6; i++) {
        var boatGeo = new THREE.BoxGeometry(6, 1.5, 2);
        var boat = new THREE.Mesh(boatGeo, boatMat);
        boat.position.set(OX - 25 + (i * 10), 1, OZ + 23);
        scene.add(boat);
      }
    }

    function ferry() {
      var mat = new THREE.MeshLambertMaterial({ color: 0xF5F5F5 });
      var hullGeo = new THREE.BoxGeometry(25, 3, 7);
      var hull = new THREE.Mesh(hullGeo, mat);
      hull.position.set(OX + 40, 1.5, OZ + 30);
      scene.add(hull);

      var superGeo = new THREE.BoxGeometry(15, 2.5, 4);
      var superStruct = new THREE.Mesh(superGeo, mat);
      superStruct.position.set(OX + 40, 4.25, OZ + 30);
      scene.add(superStruct);

      var funnelGeo1 = new THREE.CylinderGeometry(1, 1, 4, 8);
      var funnel1 = new THREE.Mesh(funnelGeo1, mat);
      funnel1.position.set(OX + 35, 7.5, OZ + 30);
      scene.add(funnel1);

      var funnelGeo2 = new THREE.CylinderGeometry(1, 1, 4, 8);
      var funnel2 = new THREE.Mesh(funnelGeo2, mat);
      funnel2.position.set(OX + 45, 7.5, OZ + 30);
      scene.add(funnel2);
    }

    function gallery() {
      var mat = new THREE.MeshLambertMaterial({ color: 0x889999 });
      var geo = new THREE.BoxGeometry(18, 14, 7);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(OX - 40, 7, OZ - 20);
      scene.add(mesh);
    }

    function park() {
      var treeMat = new THREE.MeshLambertMaterial({ color: 0x1A4A1A });
      var i;
      for (i = 0; i < 6; i++) {
        var trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 6);
        var trunk = new THREE.Mesh(trunkGeo, treeMat);
        trunk.position.set(OX - 20 + (i * 5), 2, OZ - 35);
        scene.add(trunk);

        var topGeo = new THREE.SphereGeometry(2, 6, 6);
        var top = new THREE.Mesh(topGeo, treeMat);
        top.position.set(OX - 20 + (i * 5), 5.5, OZ - 35);
        scene.add(top);
      }

      var bandBaseGeo = new THREE.CylinderGeometry(4, 4, 1, 12);
      var bandBase = new THREE.Mesh(bandBaseGeo, treeMat);
      bandBase.position.set(OX - 10, 0.5, OZ - 45);
      scene.add(bandBase);

      var bandRoofGeo = new THREE.ConeGeometry(5, 3, 12);
      var bandRoof = new THREE.Mesh(bandRoofGeo, treeMat);
      bandRoof.position.set(OX - 10, 3.5, OZ - 45);
      scene.add(bandRoof);
    }

    function highstreet() {
      var mat = new THREE.MeshLambertMaterial({ color: 0xF0EDE0 });
      var i;
      for (i = 0; i < 10; i++) {
        var geo = new THREE.BoxGeometry(5, 7, 8);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX - 45 + (i * 6), 3.5, OZ - 55);
        scene.add(mesh);
      }
    }

    function beach() {
      var sandMat = new THREE.MeshLambertMaterial({ color: 0xF4E0A0 });
      var sandGeo = new THREE.BoxGeometry(50, 0.3, 10);
      var sand = new THREE.Mesh(sandGeo, sandMat);
      sand.position.set(OX + 60, 0.15, OZ - 30);
      scene.add(sand);

      var seaMat = new THREE.MeshLambertMaterial({ color: 0x4488BB });
      var seaGeo = new THREE.BoxGeometry(50, 0.3, 15);
      var sea = new THREE.Mesh(seaGeo, seaMat);
      sea.position.set(OX + 60, 0.15, OZ - 42.5);
      scene.add(sea);
    }

    bridge();
    quay();
    ferry();
    gallery();
    park();
    highstreet();
    beach();
  };
}());
