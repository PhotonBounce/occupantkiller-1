(function (window) {
  'use strict';

  function create(scene) {
    var group = new THREE.Group();
    var ox = 7280;
    var oz = 0;

    // 1. Basing House ruins
    function ruins() {
      var mat = new THREE.MeshLambertMaterial({ color: 0xBBAA88 });
      var sections = [
        [0, 0],
        [28, 0],
        [14, 20]
      ];
      var i, wall, geo;
      for (i = 0; i < sections.length; i++) {
        geo = new THREE.BoxGeometry(25, 8, 2);
        wall = new THREE.Mesh(geo, mat);
        wall.position.set(ox + sections[i][0], 4, oz - 200 + sections[i][1]);
        group.add(wall);
      }
      // collapsed masonry piles
      var piles = [
        [5, 2, -185, 6, 3, 4],
        [20, 1.5, -190, 5, 3, 5],
        [-5, 2, -195, 4, 4, 3],
        [35, 1, -182, 7, 2, 4]
      ];
      for (i = 0; i < piles.length; i++) {
        var p = piles[i];
        geo = new THREE.BoxGeometry(p[3], p[4], p[5]);
        var pile = new THREE.Mesh(geo, mat);
        pile.position.set(ox + p[0], p[4] / 2, oz + p[2]);
        group.add(pile);
      }
    }

    // 2. Old Basing village church
    function church() {
      var mat = new THREE.MeshLambertMaterial({ color: 0xBBB8A0 });
      var navGeo = new THREE.BoxGeometry(18, 8, 10);
      var nav = new THREE.Mesh(navGeo, mat);
      nav.position.set(ox - 150, 4, oz - 150);
      group.add(nav);
      var towerGeo = new THREE.BoxGeometry(4, 14, 4);
      var tower = new THREE.Mesh(towerGeo, mat);
      tower.position.set(ox - 160, 7, oz - 150);
      group.add(tower);
      var spireGeo = new THREE.ConeGeometry(2.5, 8, 4);
      var spire = new THREE.Mesh(spireGeo, mat);
      spire.position.set(ox - 160, 18, oz - 150);
      group.add(spire);
    }

    // 3. Basingstoke town centre — Festival Place
    function mall() {
      var matMall = new THREE.MeshLambertMaterial({ color: 0x889999 });
      var mallGeo = new THREE.BoxGeometry(50, 8, 30);
      var mallMesh = new THREE.Mesh(mallGeo, matMall);
      mallMesh.position.set(ox, 4, oz);
      group.add(mallMesh);
      var matAtrium = new THREE.MeshLambertMaterial({ color: 0x88AACC });
      var atriumGeo = new THREE.BoxGeometry(30, 10, 15);
      var atrium = new THREE.Mesh(atriumGeo, matAtrium);
      atrium.position.set(ox + 5, 5, oz + 5);
      group.add(atrium);
    }

    // 4. Basingstoke War Memorial park
    function memorial() {
      var matStone = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
      var obGeo = new THREE.BoxGeometry(1, 10, 1);
      var obelisk = new THREE.Mesh(obGeo, matStone);
      obelisk.position.set(ox - 80, 5, oz + 80);
      group.add(obelisk);
      var plinthGeo = new THREE.BoxGeometry(3, 1, 3);
      var plinth = new THREE.Mesh(plinthGeo, matStone);
      plinth.position.set(ox - 80, 0.5, oz + 80);
      group.add(plinth);
      // 8 trees
      var matTree = new THREE.MeshLambertMaterial({ color: 0x336622 });
      var matTrunk = new THREE.MeshLambertMaterial({ color: 0x664422 });
      var angles = [0, 45, 90, 135, 180, 225, 270, 315];
      var i, angle, tx, tz;
      for (i = 0; i < 8; i++) {
        angle = angles[i] * Math.PI / 180;
        tx = ox - 80 + Math.cos(angle) * 15;
        tz = oz + 80 + Math.sin(angle) * 15;
        var trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 6);
        var trunk = new THREE.Mesh(trunkGeo, matTrunk);
        trunk.position.set(tx, 1.5, tz);
        group.add(trunk);
        var foliageGeo = new THREE.SphereGeometry(2, 6, 6);
        var foliage = new THREE.Mesh(foliageGeo, matTree);
        foliage.position.set(tx, 5, tz);
        group.add(foliage);
      }
    }

    // 5. The Anvil concert hall
    function anvil() {
      var mat = new THREE.MeshLambertMaterial({ color: 0x445566 });
      var mainGeo = new THREE.BoxGeometry(30, 8, 20);
      var main = new THREE.Mesh(mainGeo, mat);
      main.position.set(ox + 100, 4, oz - 60);
      group.add(main);
      var roofGeo = new THREE.BoxGeometry(30, 5, 5);
      var roof = new THREE.Mesh(roofGeo, mat);
      roof.position.set(ox + 100, 10.5, oz - 52);
      group.add(roof);
    }

    // 6. M3 motorway junction
    function motorway() {
      var mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var ramps = [
        [ox - 50, 0, oz + 150, 30, 0.3, 5, 0],
        [ox + 50, 0, oz + 150, 30, 0.3, 5, 0.5],
        [ox - 50, 0, oz + 180, 5, 0.3, 30, 0],
        [ox + 50, 0, oz + 180, 5, 0.3, 30, 0]
      ];
      var i, r, geo, ramp;
      for (i = 0; i < ramps.length; i++) {
        r = ramps[i];
        geo = new THREE.BoxGeometry(r[3], r[4], r[5]);
        ramp = new THREE.Mesh(geo, mat);
        ramp.position.set(r[0], r[1], r[2]);
        ramp.rotation.y = r[6];
        group.add(ramp);
      }
    }

    // 7. Reading Road industrial estates
    function industrial() {
      var mat = new THREE.MeshLambertMaterial({ color: 0x668877 });
      var i, geo, unit;
      for (i = 0; i < 5; i++) {
        geo = new THREE.BoxGeometry(30, 7, 15);
        unit = new THREE.Mesh(geo, mat);
        unit.position.set(ox + 200 + i * 35, 3.5, oz + 50);
        group.add(unit);
      }
    }

    // 8. Thornycroft factory
    function factory() {
      var matBrick = new THREE.MeshLambertMaterial({ color: 0x885533 });
      var matChimney = new THREE.MeshLambertMaterial({ color: 0x664422 });
      var bldGeo = new THREE.BoxGeometry(25, 8, 20);
      var bld = new THREE.Mesh(bldGeo, matBrick);
      bld.position.set(ox - 200, 4, oz + 100);
      group.add(bld);
      var chimGeo = new THREE.CylinderGeometry(2, 2, 18, 8);
      var chimney = new THREE.Mesh(chimGeo, matChimney);
      chimney.position.set(ox - 210, 9, oz + 100);
      group.add(chimney);
    }

    ruins();
    church();
    mall();
    memorial();
    anvil();
    motorway();
    industrial();
    factory();

    scene.add(group);
    return group;
  }

  window.BasingstokeLodge = { create: create };
}(window));
