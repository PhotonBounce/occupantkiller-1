window.SheffieldPost = (function() {
  'use strict';

  var WX = 2860;
  var WZ = 2200;

  var scene = null;
  var objects = [];
  var lights = [];

  /* ── Crucible Theatre ─────────────────────────────────────────────────
     In-the-round theatre, world snooker championship venue.
     Distinctive angled auditorium with red brick body.
  ────────────────────────────────────────────────────────────────────── */
  function buildCrucibleTheatre() {
    // Main auditorium box — red brick
    var bodyGeo = new THREE.BoxGeometry(18, 8, 18);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x8A3A2A });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(WX + 0, 4, WZ + 0);
    scene.add(body);
    objects.push(body);

    // Angled foyer projection — front wing
    var foyerGeo = new THREE.BoxGeometry(12, 6, 6);
    var foyerMat = new THREE.MeshLambertMaterial({ color: 0x7A2A1A });
    var foyer = new THREE.Mesh(foyerGeo, foyerMat);
    foyer.position.set(WX + 0, 3, WZ + 12);
    scene.add(foyer);
    objects.push(foyer);

    // Angled auditorium roof cap — tapered top
    var roofGeo = new THREE.BoxGeometry(20, 2, 20);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x5A2010 });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(WX + 0, 9, WZ + 0);
    scene.add(roof);
    objects.push(roof);

    // Ventilation cylinder on roof
    var ventGeo = new THREE.CylinderGeometry(1.5, 1.5, 3, 8);
    var ventMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var vent = new THREE.Mesh(ventGeo, ventMat);
    vent.position.set(WX + 5, 11.5, WZ - 5);
    scene.add(vent);
    objects.push(vent);

    // Side wing — angled extension
    var wingGeo = new THREE.BoxGeometry(6, 5, 14);
    var wingMat = new THREE.MeshLambertMaterial({ color: 0x8A3A2A });
    var wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(WX - 12, 2.5, WZ + 2);
    wing.rotation.y = 0.15;
    scene.add(wing);
    objects.push(wing);
  }

  /* ── Kelham Island Museum ─────────────────────────────────────────────
     Victorian steel works: blast furnace, rolling mills, water wheel.
  ────────────────────────────────────────────────────────────────────── */
  function buildKelhamIsland() {
    // Blast furnace remains — huge dark cylinder
    var furnaceGeo = new THREE.CylinderGeometry(4, 4, 20, 12);
    var furnaceMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    var furnace = new THREE.Mesh(furnaceGeo, furnaceMat);
    furnace.position.set(WX + 60, 10, WZ - 30);
    scene.add(furnace);
    objects.push(furnace);

    // Furnace top cone — blast exit
    var furnaceTopGeo = new THREE.ConeGeometry(4, 4, 12);
    var furnaceTopMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var furnaceTop = new THREE.Mesh(furnaceTopGeo, furnaceTopMat);
    furnaceTop.position.set(WX + 60, 22, WZ - 30);
    scene.add(furnaceTop);
    objects.push(furnaceTop);

    // Rolling mills building
    var millGeo = new THREE.BoxGeometry(30, 8, 12);
    var millMat = new THREE.MeshLambertMaterial({ color: 0x6A6A6A });
    var mill = new THREE.Mesh(millGeo, millMat);
    mill.position.set(WX + 45, 4, WZ - 15);
    scene.add(mill);
    objects.push(mill);

    // Rolling mill roof — sawtooth north-light profile approximated by boxes
    var northlightGeo = new THREE.BoxGeometry(32, 2, 3);
    var northlightMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var northlight = new THREE.Mesh(northlightGeo, northlightMat);
    northlight.position.set(WX + 45, 8.5, WZ - 15);
    scene.add(northlight);
    objects.push(northlight);

    // Water wheel box — side housing
    var wheelBoxGeo = new THREE.BoxGeometry(6, 10, 6);
    var wheelBoxMat = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
    var wheelBox = new THREE.Mesh(wheelBoxGeo, wheelBoxMat);
    wheelBox.position.set(WX + 40, 5, WZ - 28);
    scene.add(wheelBox);
    objects.push(wheelBox);

    // Water wheel cylinder (side-on)
    var wheelGeo = new THREE.CylinderGeometry(4, 4, 2, 16);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x6B4A2A });
    var wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(WX + 40, 5, WZ - 28);
    scene.add(wheel);
    objects.push(wheel);

    // River Don water channel box
    var donGeo = new THREE.BoxGeometry(80, 1, 4);
    var donMat = new THREE.MeshLambertMaterial({ color: 0x3A6A8A });
    var don = new THREE.Mesh(donGeo, donMat);
    don.position.set(WX + 40, 0.2, WZ - 35);
    scene.add(don);
    objects.push(don);

    // Chimney stack
    var chimneyGeo = new THREE.CylinderGeometry(1.2, 1.8, 18, 8);
    var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x5A3A2A });
    var chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
    chimney.position.set(WX + 55, 9, WZ - 10);
    scene.add(chimney);
    objects.push(chimney);
  }

  /* ── Sheffield Cathedral ──────────────────────────────────────────────
     Gothic city cathedral with nave, lantern tower, and side chapels.
  ────────────────────────────────────────────────────────────────────── */
  function buildSheffieldCathedral() {
    // Nave — main body
    var naveGeo = new THREE.BoxGeometry(22, 14, 10);
    var naveMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });
    var nave = new THREE.Mesh(naveGeo, naveMat);
    nave.position.set(WX - 40, 7, WZ + 20);
    scene.add(nave);
    objects.push(nave);

    // Lantern tower — tall central tower
    var towerGeo = new THREE.BoxGeometry(7, 22, 7);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0xC49A6A });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(WX - 40, 11, WZ + 20);
    scene.add(tower);
    objects.push(tower);

    // Tower pinnacle — cone spire
    var spireGeo = new THREE.ConeGeometry(3.5, 8, 8);
    var spireMat = new THREE.MeshLambertMaterial({ color: 0xB48A5A });
    var spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.set(WX - 40, 26, WZ + 20);
    scene.add(spire);
    objects.push(spire);

    // North transept
    var transeptNGeo = new THREE.BoxGeometry(8, 11, 6);
    var transeptNMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });
    var transeptN = new THREE.Mesh(transeptNGeo, transeptNMat);
    transeptN.position.set(WX - 40, 5.5, WZ + 26);
    scene.add(transeptN);
    objects.push(transeptN);

    // South transept
    var transeptSGeo = new THREE.BoxGeometry(8, 11, 6);
    var transeptSMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });
    var transeptS = new THREE.Mesh(transeptSGeo, transeptSMat);
    transeptS.position.set(WX - 40, 5.5, WZ + 14);
    scene.add(transeptS);
    objects.push(transeptS);

    // Chancel — east end
    var chancelGeo = new THREE.BoxGeometry(10, 10, 8);
    var chancelMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });
    var chancel = new THREE.Mesh(chancelGeo, chancelMat);
    chancel.position.set(WX - 50, 5, WZ + 20);
    scene.add(chancel);
    objects.push(chancel);

    // Buttress pillars — decorative cylinders
    var butGeo = new THREE.CylinderGeometry(0.6, 0.8, 14, 6);
    var butMat = new THREE.MeshLambertMaterial({ color: 0xC49A6A });
    var buttress1 = new THREE.Mesh(butGeo, butMat);
    buttress1.position.set(WX - 30, 7, WZ + 16);
    scene.add(buttress1);
    objects.push(buttress1);

    var buttress2 = new THREE.Mesh(butGeo, butMat);
    buttress2.position.set(WX - 30, 7, WZ + 24);
    scene.add(buttress2);
    objects.push(buttress2);
  }

  /* ── Millhouses Park Bandstand ────────────────────────────────────────
     Victorian octagonal bandstand with conical roof and columns.
  ────────────────────────────────────────────────────────────────────── */
  function buildMillhousesBandstand() {
    // Platform base — octagonal approximated by cylinder
    var platformGeo = new THREE.CylinderGeometry(5, 5, 1, 8);
    var platformMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(WX - 20, 0.5, WZ + 60);
    scene.add(platform);
    objects.push(platform);

    // Roof cone — Victorian decorative
    var roofGeo = new THREE.ConeGeometry(6, 5, 8);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x336644 });
    var bandRoof = new THREE.Mesh(roofGeo, roofMat);
    bandRoof.position.set(WX - 20, 9, WZ + 60);
    scene.add(bandRoof);
    objects.push(bandRoof);

    // Centre support cylinder
    var centreGeo = new THREE.CylinderGeometry(0.5, 0.5, 7, 8);
    var centreMat = new THREE.MeshLambertMaterial({ color: 0x6A5A3A });
    var centre = new THREE.Mesh(centreGeo, centreMat);
    centre.position.set(WX - 20, 4, WZ + 60);
    scene.add(centre);
    objects.push(centre);

    // Eight perimeter columns (CylinderGeometry as required)
    var colPositions = [
      [4.5, 0],
      [3.2, 3.2],
      [0, 4.5],
      [-3.2, 3.2],
      [-4.5, 0],
      [-3.2, -3.2],
      [0, -4.5],
      [3.2, -3.2]
    ];
    var colGeo = new THREE.CylinderGeometry(0.25, 0.25, 6, 6);
    var colMat = new THREE.MeshLambertMaterial({ color: 0x8A8A7A });
    for (var ci = 0; ci < colPositions.length; ci++) {
      var col = new THREE.Mesh(colGeo, colMat);
      col.position.set(WX - 20 + colPositions[ci][0], 3.5, WZ + 60 + colPositions[ci][1]);
      scene.add(col);
      objects.push(col);
    }

    // Decorative sphere finial on top
    var finialGeo = new THREE.SphereGeometry(0.5, 8, 8);
    var finialMat = new THREE.MeshLambertMaterial({ color: 0xCCAA44 });
    var finial = new THREE.Mesh(finialGeo, finialMat);
    finial.position.set(WX - 20, 11.5, WZ + 60);
    scene.add(finial);
    objects.push(finial);

    // Park path boxes around bandstand
    var path1Geo = new THREE.BoxGeometry(30, 0.2, 2);
    var pathMat = new THREE.MeshLambertMaterial({ color: 0xBBAA88 });
    var path1 = new THREE.Mesh(path1Geo, pathMat);
    path1.position.set(WX - 20, 0.05, WZ + 60);
    scene.add(path1);
    objects.push(path1);
  }

  /* ── Meadowhall Shopping Centre ──────────────────────────────────────
     Large modern retail box with dome skylights.
  ────────────────────────────────────────────────────────────────────── */
  function buildMeadowhall() {
    // Main retail shed
    var mainGeo = new THREE.BoxGeometry(60, 10, 40);
    var mainMat = new THREE.MeshLambertMaterial({ color: 0x8A8A8A });
    var main = new THREE.Mesh(mainGeo, mainMat);
    main.position.set(WX + 100, 5, WZ + 30);
    scene.add(main);
    objects.push(main);

    // Glass dome skylights (spheres on roof)
    var domePositions = [
      [100, 40],
      [115, 30],
      [85, 30],
      [100, 20]
    ];
    var domeGeo = new THREE.SphereGeometry(6, 12, 8);
    var domeMat = new THREE.MeshLambertMaterial({ color: 0xAABBCC });
    for (var di = 0; di < domePositions.length; di++) {
      var dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(WX + domePositions[di][0], 13, WZ + domePositions[di][1]);
      dome.scale.y = 0.5;
      scene.add(dome);
      objects.push(dome);
    }

    // Car park ramp box
    var rampGeo = new THREE.BoxGeometry(20, 8, 12);
    var rampMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(WX + 130, 4, WZ + 30);
    scene.add(ramp);
    objects.push(ramp);

    // Entrance canopy box
    var canopyGeo = new THREE.BoxGeometry(30, 3, 6);
    var canopyMat = new THREE.MeshLambertMaterial({ color: 0x9A9A9A });
    var canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(WX + 100, 11.5, WZ + 51);
    scene.add(canopy);
    objects.push(canopy);

    // Tram stop shelter (Meadowhall Interchange)
    var tramGeo = new THREE.BoxGeometry(24, 4, 5);
    var tramMat = new THREE.MeshLambertMaterial({ color: 0x6688AA });
    var tram = new THREE.Mesh(tramGeo, tramMat);
    tram.position.set(WX + 100, 2, WZ + 58);
    scene.add(tram);
    objects.push(tram);
  }

  /* ── River Don ────────────────────────────────────────────────────────
     Wide water channel flowing through the steel city.
  ────────────────────────────────────────────────────────────────────── */
  function buildRiverDon() {
    // Main river channel — broad box
    var don1Geo = new THREE.BoxGeometry(160, 0.5, 8);
    var riverMat = new THREE.MeshLambertMaterial({ color: 0x3A6A8A });
    var don1 = new THREE.Mesh(don1Geo, riverMat);
    don1.position.set(WX + 60, 0.1, WZ - 50);
    scene.add(don1);
    objects.push(don1);

    // Bank edging — dark silt box
    var bank1Geo = new THREE.BoxGeometry(160, 1, 2);
    var bankMat = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
    var bank1 = new THREE.Mesh(bank1Geo, bankMat);
    bank1.position.set(WX + 60, 0.3, WZ - 45);
    scene.add(bank1);
    objects.push(bank1);

    var bank2 = new THREE.Mesh(bank1Geo, bankMat);
    bank2.position.set(WX + 60, 0.3, WZ - 55);
    scene.add(bank2);
    objects.push(bank2);

    // Lady's Bridge approximation — box
    var bridgeGeo = new THREE.BoxGeometry(10, 2, 12);
    var bridgeMat = new THREE.MeshLambertMaterial({ color: 0xAA9977 });
    var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(WX - 10, 2, WZ - 50);
    scene.add(bridge);
    objects.push(bridge);

    // Bridge piers — cylinders
    var pierGeo = new THREE.CylinderGeometry(0.8, 1.0, 4, 8);
    var pierMat = new THREE.MeshLambertMaterial({ color: 0x998866 });
    var pier1 = new THREE.Mesh(pierGeo, pierMat);
    pier1.position.set(WX - 13, 0, WZ - 50);
    scene.add(pier1);
    objects.push(pier1);

    var pier2 = new THREE.Mesh(pierGeo, pierMat);
    pier2.position.set(WX - 7, 0, WZ - 50);
    scene.add(pier2);
    objects.push(pier2);
  }

  /* ── River Sheaf ─────────────────────────────────────────────────────
     Smaller tributary flowing through city centre to meet the Don.
  ────────────────────────────────────────────────────────────────────── */
  function buildRiverSheaf() {
    // Sheaf channel — narrower than Don
    var sheaf1Geo = new THREE.BoxGeometry(5, 0.4, 80);
    var sheafMat = new THREE.MeshLambertMaterial({ color: 0x4A7A9A });
    var sheaf1 = new THREE.Mesh(sheaf1Geo, sheafMat);
    sheaf1.position.set(WX - 5, 0.1, WZ + 10);
    scene.add(sheaf1);
    objects.push(sheaf1);

    // Sheaf bank
    var sheafBankGeo = new THREE.BoxGeometry(2, 0.8, 80);
    var sheafBankMat = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
    var sheafBank = new THREE.Mesh(sheafBankGeo, sheafBankMat);
    sheafBank.position.set(WX - 8, 0.2, WZ + 10);
    scene.add(sheafBank);
    objects.push(sheafBank);

    // Confluence point — wider box where rivers meet
    var confluenceGeo = new THREE.BoxGeometry(12, 0.5, 12);
    var confluenceMat = new THREE.MeshLambertMaterial({ color: 0x3A6A8A });
    var confluence = new THREE.Mesh(confluenceGeo, confluenceMat);
    confluence.position.set(WX - 5, 0.15, WZ - 50);
    scene.add(confluence);
    objects.push(confluence);
  }

  /* ── Sheffield Steel Industry Details ────────────────────────────────
     Additional steel city character: works chimneys, cooling towers.
  ────────────────────────────────────────────────────────────────────── */
  function buildSteelDetails() {
    // Steel works chimney cluster
    var chimPositions = [
      [WX + 70, WZ + 0],
      [WX + 75, WZ + 8],
      [WX + 65, WZ + 5]
    ];
    var chimGeo = new THREE.CylinderGeometry(0.8, 1.2, 22, 8);
    var chimMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
    for (var chi = 0; chi < chimPositions.length; chi++) {
      var chim = new THREE.Mesh(chimGeo, chimMat);
      chim.position.set(chimPositions[chi][0], 11, chimPositions[chi][1]);
      scene.add(chim);
      objects.push(chim);
    }

    // Cooling tower pair — large cylinders
    var coolGeo = new THREE.CylinderGeometry(5, 7, 18, 12);
    var coolMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
    var cool1 = new THREE.Mesh(coolGeo, coolMat);
    cool1.position.set(WX + 90, 9, WZ - 15);
    scene.add(cool1);
    objects.push(cool1);

    var cool2 = new THREE.Mesh(coolGeo, coolMat);
    cool2.position.set(WX + 90, 9, WZ - 0);
    scene.add(cool2);
    objects.push(cool2);

    // Wire cable detail — LineSegments across steel works
    var cablePoints = [
      new THREE.Vector3(WX + 60, 20, WZ - 30),
      new THREE.Vector3(WX + 75, 22, WZ - 10),
      new THREE.Vector3(WX + 90, 18, WZ - 15)
    ];
    var cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    var cable = new THREE.LineSegments(cableGeo, cableMat);
    scene.add(cable);
    objects.push(cable);

    // Steel billet stacks (box piles)
    var billetGeo = new THREE.BoxGeometry(6, 3, 2);
    var billetMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var billet1 = new THREE.Mesh(billetGeo, billetMat);
    billet1.position.set(WX + 50, 1.5, WZ - 10);
    scene.add(billet1);
    objects.push(billet1);

    var billet2 = new THREE.Mesh(billetGeo, billetMat);
    billet2.position.set(WX + 50, 4.5, WZ - 10);
    scene.add(billet2);
    objects.push(billet2);

    // Park Hill flats silhouette — iconic brutalist housing
    var parkhillGeo = new THREE.BoxGeometry(40, 16, 8);
    var parkhillMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var parkhill = new THREE.Mesh(parkhillGeo, parkhillMat);
    parkhill.position.set(WX - 25, 8, WZ - 20);
    scene.add(parkhill);
    objects.push(parkhill);

    // Deck access walkways on Park Hill
    var deckGeo = new THREE.BoxGeometry(42, 1, 1.5);
    var deckMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    for (var di = 0; di < 3; di++) {
      var deck = new THREE.Mesh(deckGeo, deckMat);
      deck.position.set(WX - 25, 4 + di * 5, WZ - 16);
      scene.add(deck);
      objects.push(deck);
    }
  }

  /* ── Ambient lights ────────────────────────────────────────────────── */
  function buildLights() {
    var ambient = new THREE.AmbientLight(0xBBCCDD, 0.55);
    scene.add(ambient);
    lights.push(ambient);

    var sun = new THREE.DirectionalLight(0xFFEECC, 0.85);
    sun.position.set(WX - 100, 80, WZ - 80);
    scene.add(sun);
    lights.push(sun);

    // Street sodium glow over steel district
    var sodiumGlow = new THREE.PointLight(0xFFAA44, 0.9, 120);
    sodiumGlow.position.set(WX + 55, 18, WZ - 10);
    scene.add(sodiumGlow);
    lights.push(sodiumGlow);
  }

  /* ── Public API ────────────────────────────────────────────────────── */
  function init(sceneRef) {
    scene = sceneRef;
    objects = [];
    lights = [];
    buildCrucibleTheatre();
    buildKelhamIsland();
    buildSheffieldCathedral();
    buildMillhousesBandstand();
    buildMeadowhall();
    buildRiverDon();
    buildRiverSheaf();
    buildSteelDetails();
    buildLights();
  }

  function update(delta) {
    // Gentle rotation of the bandstand finial
    for (var i = 0; i < objects.length; i++) {
      if (objects[i] && objects[i].name === 'finial') {
        objects[i].rotation.y += delta * 0.4;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      if (scene) scene.remove(objects[i]);
      if (objects[i].geometry) objects[i].geometry.dispose();
      if (objects[i].material) objects[i].material.dispose();
    }
    for (var j = 0; j < lights.length; j++) {
      if (scene) scene.remove(lights[j]);
    }
    objects = [];
    lights = [];
    scene = null;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
