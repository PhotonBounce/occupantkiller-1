(function (window) {
  'use strict';

  window.StAustellEden = function (scene) {

    var OX = 8120;
    var OZ = 0;

    function place(mesh, x, y, z) {
      mesh.position.set(OX + x, y, OZ + z);
      scene.add(mesh);
      return mesh;
    }

    // ─── 1. Eden Project biomes ───────────────────────────────────────────────

    function biomes() {
      var glassMat = new THREE.MeshLambertMaterial({ color: 0x88AACC, transparent: true, opacity: 0.7 });
      var kaolinMat = new THREE.MeshLambertMaterial({ color: 0xBBBBAA });

      // Humid Tropics biome: 3 linked spheres (radii 15, 12, 9), half-buried at y=-8
      var geomHT1 = new THREE.SphereGeometry(15, 16, 12);
      var domeHT1 = new THREE.Mesh(geomHT1, glassMat);
      place(domeHT1, -40, -8, -60);

      var geomHT2 = new THREE.SphereGeometry(12, 16, 12);
      var domeHT2 = new THREE.Mesh(geomHT2, glassMat);
      place(domeHT2, -18, -8, -60);

      var geomHT3 = new THREE.SphereGeometry(9, 16, 12);
      var domeHT3 = new THREE.Mesh(geomHT3, glassMat);
      place(domeHT3, -2, -8, -60);

      // Mediterranean biome: 2 spheres (radii 10, 8), half-buried
      var geomMed1 = new THREE.SphereGeometry(10, 16, 12);
      var domeMed1 = new THREE.Mesh(geomMed1, glassMat);
      place(domeMed1, 20, -8, -60);

      var geomMed2 = new THREE.SphereGeometry(8, 16, 12);
      var domeMed2 = new THREE.Mesh(geomMed2, glassMat);
      place(domeMed2, 34, -8, -60);

      // China clay pit walls (4 sides)
      var wallGeomN = new THREE.BoxGeometry(60, 20, 0.3);
      var wallN = new THREE.Mesh(wallGeomN, kaolinMat);
      place(wallN, -5, 2, -80);

      var wallGeomS = new THREE.BoxGeometry(60, 20, 0.3);
      var wallS = new THREE.Mesh(wallGeomS, kaolinMat);
      place(wallS, -5, 2, -40);

      var wallGeomE = new THREE.BoxGeometry(0.3, 20, 60);
      var wallE = new THREE.Mesh(wallGeomE, kaolinMat);
      place(wallE, 25, 2, -60);

      var wallGeomW = new THREE.BoxGeometry(0.3, 20, 60);
      var wallW = new THREE.Mesh(wallGeomW, kaolinMat);
      place(wallW, -35, 2, -60);
    }

    // ─── 2. China clay tips (Cornish Alps) ───────────────────────────────────

    function tips() {
      var spoilMat = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });

      var positions = [
        [80, 40],
        [115, 50],
        [95, 75],
        [130, 30]
      ];

      for (var i = 0; i < positions.length; i++) {
        var geom = new THREE.ConeGeometry(15, 20, 16);
        var mound = new THREE.Mesh(geom, spoilMat);
        place(mound, positions[i][0], 10, positions[i][1]);
      }
    }

    // ─── 3. Lost Gardens of Heligan ──────────────────────────────────────────

    function heligan() {
      var foliageMat = new THREE.MeshLambertMaterial({ color: 0x1A4A1A });
      var trunkMat = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
      var frondMat = new THREE.MeshLambertMaterial({ color: 0x2D6A2D });

      // 8 exotic plant spheres
      var plantSpots = [
        [-80, 20], [-70, 35], [-90, 45],
        [-75, 60], [-65, 50], [-95, 30],
        [-85, 65], [-60, 40]
      ];

      for (var i = 0; i < plantSpots.length; i++) {
        var geom = new THREE.SphereGeometry(2, 8, 8);
        var plant = new THREE.Mesh(geom, foliageMat);
        place(plant, plantSpots[i][0], 2, plantSpots[i][1]);
      }

      // 3 palm trees: trunk + frond crown
      var palmSpots = [
        [-78, 28], [-68, 55], [-88, 50]
      ];

      for (var j = 0; j < palmSpots.length; j++) {
        var trunkGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
        var trunk = new THREE.Mesh(trunkGeom, trunkMat);
        place(trunk, palmSpots[j][0], 4, palmSpots[j][1]);

        var frondGeom = new THREE.ConeGeometry(4, 3, 8);
        var frond = new THREE.Mesh(frondGeom, frondMat);
        place(frond, palmSpots[j][0], 9, palmSpots[j][1]);
      }
    }

    // ─── 4. St Austell Brewery ────────────────────────────────────────────────

    function brewery() {
      var brickMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
      var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x663322 });

      var brewGeom = new THREE.BoxGeometry(25, 10, 20);
      var brew = new THREE.Mesh(brewGeom, brickMat);
      place(brew, 0, 5, 60);

      var chimneyGeom = new THREE.CylinderGeometry(2, 2, 20, 12);
      var chimney = new THREE.Mesh(chimneyGeom, chimneyMat);
      place(chimney, 10, 10, 55);
    }

    // ─── 5. St Austell Town ──────────────────────────────────────────────────

    function town() {
      var lightMat = new THREE.MeshLambertMaterial({ color: 0xF0EDE0 });
      var darkMat = new THREE.MeshLambertMaterial({ color: 0x9B3A2A });

      var shopData = [
        [-30, 100, lightMat],
        [-22, 100, darkMat],
        [-14, 100, lightMat],
        [-6,  100, darkMat],
        [2,   100, lightMat],
        [10,  100, darkMat],
        [18,  100, lightMat],
        [26,  100, darkMat]
      ];

      for (var i = 0; i < shopData.length; i++) {
        var geom = new THREE.BoxGeometry(5, 8, 7);
        var shop = new THREE.Mesh(geom, shopData[i][2]);
        place(shop, shopData[i][0], 4, shopData[i][1]);
      }
    }

    // ─── Run all builders ─────────────────────────────────────────────────────

    biomes();
    tips();
    heligan();
    brewery();
    town();

  };

}(window));
