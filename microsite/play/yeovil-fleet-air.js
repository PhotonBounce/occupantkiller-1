(function (window) {
  'use strict';

  function build() {
    var group = new THREE.Group();
    var OX = 7600;
    var OZ = 0;

    // -----------------------------------------------------------------------
    // 1. Fleet Air Arm Museum (Yeovilton)
    // -----------------------------------------------------------------------

    function museum() {
      var g = new THREE.Group();

      // Main hall 50x25x10
      var hallMat = new THREE.MeshLambertMaterial({ color: 0x778888 });
      var hall = new THREE.Mesh(new THREE.BoxGeometry(50, 10, 25), hallMat);
      hall.position.set(0, 5, 0);
      g.add(hall);

      // Concorde fuselage 30x3x3
      var concMat = new THREE.MeshLambertMaterial({ color: 0xF8F8F8 });
      var fuse = new THREE.Mesh(new THREE.BoxGeometry(30, 3, 3), concMat);
      fuse.position.set(0, 2.5, 0);
      g.add(fuse);

      // Concorde delta wings 20x0.5x10
      var wings = new THREE.Mesh(new THREE.BoxGeometry(20, 0.5, 10), concMat);
      wings.position.set(0, 1.5, 0);
      g.add(wings);

      // Carrier deck 40x0.3x20
      var deckMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var deck = new THREE.Mesh(new THREE.BoxGeometry(40, 0.3, 20), deckMat);
      deck.position.set(0, 0.15, 30);
      g.add(deck);

      g.position.set(OX - 300, 0, OZ - 200);
      return g;
    }

    group.add(museum());

    // -----------------------------------------------------------------------
    // 2. RNAS Yeovilton air station
    // -----------------------------------------------------------------------

    function airstation() {
      var g = new THREE.Group();

      // Control tower 6x6x14
      var towerMat = new THREE.MeshLambertMaterial({ color: 0x889999 });
      var tower = new THREE.Mesh(new THREE.BoxGeometry(6, 14, 6), towerMat);
      tower.position.set(0, 7, 0);
      g.add(tower);

      // 2 hangars 40x20x8
      var hangarMat = new THREE.MeshLambertMaterial({ color: 0x778888 });
      var hangar1 = new THREE.Mesh(new THREE.BoxGeometry(40, 8, 20), hangarMat);
      hangar1.position.set(-50, 4, 0);
      g.add(hangar1);

      var hangar2 = new THREE.Mesh(new THREE.BoxGeometry(40, 8, 20), hangarMat);
      hangar2.position.set(50, 4, 0);
      g.add(hangar2);

      // 4 runways 4x0.3x100
      var runMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var offsets = [-60, -20, 20, 60];
      for (var i = 0; i < offsets.length; i++) {
        var runway = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 100), runMat);
        runway.position.set(offsets[i], 0.15, 80);
        g.add(runway);
      }

      g.position.set(OX - 100, 0, OZ + 100);
      return g;
    }

    group.add(airstation());

    // -----------------------------------------------------------------------
    // 3. Leonardo helicopters factory
    // -----------------------------------------------------------------------

    function leonardo() {
      var g = new THREE.Group();

      // Factory 60x30x10
      var factMat = new THREE.MeshLambertMaterial({ color: 0x778888 });
      var factory = new THREE.Mesh(new THREE.BoxGeometry(60, 10, 30), factMat);
      factory.position.set(0, 5, 0);
      g.add(factory);

      // Helicopter fuselage 6x2x2
      var heliMat = new THREE.MeshLambertMaterial({ color: 0x222244 });
      var fuse = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 2), heliMat);
      fuse.position.set(0, 12, 0);
      g.add(fuse);

      // 4 rotor blades 8x0.2x0.6
      var bladeOffsets = [
        [4.5, 0], [-4.5, 0], [0, 4.5], [0, -4.5]
      ];
      for (var b = 0; b < bladeOffsets.length; b++) {
        var blade = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 0.6), heliMat);
        blade.position.set(bladeOffsets[b][0], 13.5, bladeOffsets[b][1]);
        if (b >= 2) {
          blade.rotation.y = Math.PI / 2;
        }
        g.add(blade);
      }

      // Tail rotor 2x0.1x0.4
      var tailRotor = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.4), heliMat);
      tailRotor.position.set(-4, 12, 1.2);
      g.add(tailRotor);

      g.position.set(OX + 200, 0, OZ - 100);
      return g;
    }

    group.add(leonardo());

    // -----------------------------------------------------------------------
    // 4. Yeovil town centre — 8 shops
    // -----------------------------------------------------------------------

    function towncentre() {
      var g = new THREE.Group();
      var colors = [0xF0EDE0, 0x8B3A2A];
      for (var s = 0; s < 8; s++) {
        var mat = new THREE.MeshLambertMaterial({ color: colors[s % 2] });
        var shop = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 7), mat);
        shop.position.set(s * 10 - 35, 4, 0);
        g.add(shop);
      }
      g.position.set(OX + 0, 0, OZ + 300);
      return g;
    }

    group.add(towncentre());

    // -----------------------------------------------------------------------
    // 5. St John the Baptist church
    // -----------------------------------------------------------------------

    function church() {
      var g = new THREE.Group();

      // Nave 22x10x14
      var stoneMat = new THREE.MeshLambertMaterial({ color: 0xCCBBAA });
      var nave = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 14), stoneMat);
      nave.position.set(0, 5, 0);
      g.add(nave);

      // Tower 5x16x5
      var towerBox = new THREE.Mesh(new THREE.BoxGeometry(5, 16, 5), stoneMat);
      towerBox.position.set(-13.5, 8, 0);
      g.add(towerBox);

      // Spire ConeGeometry
      var spire = new THREE.Mesh(new THREE.ConeGeometry(3, 10, 8), stoneMat);
      spire.position.set(-13.5, 21, 0);
      g.add(spire);

      g.position.set(OX + 50, 0, OZ + 200);
      return g;
    }

    group.add(church());

    // -----------------------------------------------------------------------
    // 6. Montacute House
    // -----------------------------------------------------------------------

    function montacute() {
      var g = new THREE.Group();

      // Main mansion 40x12x20 Ham stone
      var hamMat = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
      var mansion = new THREE.Mesh(new THREE.BoxGeometry(40, 12, 20), hamMat);
      mansion.position.set(0, 6, 0);
      g.add(mansion);

      // 2 symmetrical towers 5x14x5
      var tower1 = new THREE.Mesh(new THREE.BoxGeometry(5, 14, 5), hamMat);
      tower1.position.set(-22.5, 7, 0);
      g.add(tower1);

      var tower2 = new THREE.Mesh(new THREE.BoxGeometry(5, 14, 5), hamMat);
      tower2.position.set(22.5, 7, 0);
      g.add(tower2);

      g.position.set(OX - 500, 0, OZ + 150);
      return g;
    }

    group.add(montacute());

    return group;
  }

  window.YeovilFleetAir = { build: build };

}(window));
