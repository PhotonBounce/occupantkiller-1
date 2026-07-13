(function (window) {
  'use strict';

  function build(scene) {
    var ox = 7920;
    var oz = 0;

    // --- Sea ---
    var seaGeo = new THREE.BoxGeometry(60, 0.3, 20);
    var seaMat = new THREE.MeshLambertMaterial({ color: 0x4488BB });
    var sea = new THREE.Mesh(seaGeo, seaMat);
    sea.position.set(ox + 0, -0.15, oz + 0);
    scene.add(sea);

    // --- Boscastle harbour walls (V inlet) ---
    var wallMat = new THREE.MeshLambertMaterial({ color: 0xAA9988 });

    var wallGeoL = new THREE.BoxGeometry(4, 2, 25);
    var wallL = new THREE.Mesh(wallGeoL, wallMat);
    wallL.position.set(ox - 8, 1, oz - 5);
    wallL.rotation.y = 0.18;
    scene.add(wallL);

    var wallGeoR = new THREE.BoxGeometry(4, 2, 25);
    var wallR = new THREE.Mesh(wallGeoR, wallMat);
    wallR.position.set(ox + 8, 1, oz - 5);
    wallR.rotation.y = -0.18;
    scene.add(wallR);

    // --- Harbour water ---
    var hwGeo = new THREE.BoxGeometry(15, 0.3, 20);
    var hwMat = new THREE.MeshLambertMaterial({ color: 0x336688 });
    var hw = new THREE.Mesh(hwGeo, hwMat);
    hw.position.set(ox + 0, 0, oz - 5);
    scene.add(hw);

    // --- 4 Fishing boats ---
    var boatMat = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    var boatPositions = [
      [-4, 0, -6],
      [4, 0, -6],
      [-4, 0, -10],
      [4, 0, -10]
    ];
    for (var b = 0; b < boatPositions.length; b++) {
      var bGeo = new THREE.BoxGeometry(2, 0.6, 4);
      var boat = new THREE.Mesh(bGeo, boatMat);
      boat.position.set(ox + boatPositions[b][0], boatPositions[b][1] + 0.3, oz + boatPositions[b][2]);
      scene.add(boat);
    }

    // --- Boscastle village: 8 stone cottages ---
    var cottageMat = new THREE.MeshLambertMaterial({ color: 0xBBB8A0 });
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    for (var c = 0; c < 8; c++) {
      var cx = ox - 16 + (c % 4) * 6;
      var cz = oz + 10 + Math.floor(c / 4) * 8;
      var cGeo = new THREE.BoxGeometry(5, 5, 6);
      var cottage = new THREE.Mesh(cGeo, cottageMat);
      cottage.position.set(cx, 2.5, cz);
      scene.add(cottage);
      var rGeo = new THREE.ConeGeometry(4, 2.5, 4);
      var roof = new THREE.Mesh(rGeo, roofMat);
      roof.position.set(cx, 6.25, cz);
      roof.rotation.y = Math.PI / 4;
      scene.add(roof);
    }

    // --- Museum of Witchcraft Boscastle ---
    var museumMat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    var museumGeo = new THREE.BoxGeometry(8, 6, 5);
    var museum = new THREE.Mesh(museumGeo, museumMat);
    museum.position.set(ox - 20, 3, oz + 8);
    scene.add(museum);

    // --- Clovelly: 10 white cottages stepped at increasing y (-2 per row) ---
    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var clovellyRoofMat = new THREE.MeshLambertMaterial({ color: 0x997755 });
    for (var w = 0; w < 10; w++) {
      var wy = -2 * w;
      var wx = ox + 25 + (w % 5) * 6;
      var wz = oz + 5 + Math.floor(w / 5) * 8;
      var wGeo = new THREE.BoxGeometry(4, 5, 6);
      var wCottage = new THREE.Mesh(wGeo, whiteMat);
      wCottage.position.set(wx, wy + 2.5, wz);
      scene.add(wCottage);
      var wrGeo = new THREE.ConeGeometry(3.2, 2, 4);
      var wroof = new THREE.Mesh(wrGeo, clovellyRoofMat);
      wroof.position.set(wx, wy + 6, wz);
      wroof.rotation.y = Math.PI / 4;
      scene.add(wroof);
    }

    // --- Donkey body + 4 legs ---
    var donkeyMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var donkeyBodyGeo = new THREE.BoxGeometry(1.5, 0.8, 0.8);
    var donkeyBody = new THREE.Mesh(donkeyBodyGeo, donkeyMat);
    donkeyBody.position.set(ox + 28, -3 + 1.3, oz + 12);
    scene.add(donkeyBody);

    var legOffsets = [
      [0.4, 0.3],
      [-0.4, 0.3],
      [0.4, -0.3],
      [-0.4, -0.3]
    ];
    for (var l = 0; l < legOffsets.length; l++) {
      var legGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
      var leg = new THREE.Mesh(legGeo, donkeyMat);
      leg.position.set(
        ox + 28 + legOffsets[l][0],
        -3 + 0.55,
        oz + 12 + legOffsets[l][1]
      );
      scene.add(leg);
    }

    // --- Clovelly harbour quay ---
    var quayGeo = new THREE.BoxGeometry(3, 1, 20);
    var quayMat = new THREE.MeshLambertMaterial({ color: 0xAA9988 });
    var quay = new THREE.Mesh(quayGeo, quayMat);
    quay.position.set(ox + 40, 0.5, oz - 5);
    scene.add(quay);

    // --- Red Lion Hotel ---
    var hotelGeo = new THREE.BoxGeometry(10, 8, 7);
    var hotelMat = new THREE.MeshLambertMaterial({ color: 0xF5F5F0 });
    var hotel = new THREE.Mesh(hotelGeo, hotelMat);
    hotel.position.set(ox + 40, 4, oz + 5);
    scene.add(hotel);

    // --- High Cliff: tall cliff face boxes (450m dramatic) ---
    var cliffMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
    var cliffCount = 12;
    for (var k = 0; k < cliffCount; k++) {
      var cliffGeo = new THREE.BoxGeometry(3, 0.3, 30);
      var cliff = new THREE.Mesh(cliffGeo, cliffMat);
      cliff.position.set(ox - 25 + k * 4, 3 + k * 0.3, oz - 15);
      scene.add(cliff);
    }
  }

  window.BoscastleClovelly = { build: build };

}(window));
