window.TallinnOldTown = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 23440;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function buildToompeaCastle() {
        // Hilltop base — limestone hill
        var hillGeo = new THREE.CylinderGeometry(80, 100, 22, 8);
        var hill = makeMesh(hillGeo, 0x9A9070);
        hill.position.set(OX - 60, OY + 11, OZ - 40);

        // Castle keep — main rectangular block
        var keepGeo = new THREE.BoxGeometry(90, 30, 70);
        var keep = makeMesh(keepGeo, 0xD4C8B0);
        keep.position.set(OX - 60, OY + 37, OZ - 40);

        // Tall Hermann Tower (Pikk Hermann) — 50m
        var hermannGeo = new THREE.BoxGeometry(12, 50, 12);
        var hermann = makeMesh(hermannGeo, 0xC8BC9E);
        hermann.position.set(OX - 95, OY + 47, OZ - 60);

        // Tall Hermann parapet
        var hermannParapetGeo = new THREE.BoxGeometry(14, 4, 14);
        var hermannParapet = makeMesh(hermannParapetGeo, 0xBEB49A);
        hermannParapet.position.set(OX - 95, OY + 74, OZ - 60);

        // Flag mast on Tall Hermann
        var flagMastGeo = new THREE.CylinderGeometry(0.4, 0.4, 14, 6);
        var flagMast = makeMesh(flagMastGeo, 0x888888);
        flagMast.position.set(OX - 95, OY + 84, OZ - 60);

        // Estonian flag — blue stripe
        var flagBlueGeo = new THREE.BoxGeometry(6, 1.8, 0.2);
        var flagBlue = makeMesh(flagBlueGeo, 0x0072CE);
        flagBlue.position.set(OX - 92, OY + 90, OZ - 60);

        // Estonian flag — black stripe
        var flagBlackGeo = new THREE.BoxGeometry(6, 1.8, 0.2);
        var flagBlack = makeMesh(flagBlackGeo, 0x111111);
        flagBlack.position.set(OX - 92, OY + 88, OZ - 60);

        // Estonian flag — white stripe
        var flagWhiteGeo = new THREE.BoxGeometry(6, 1.8, 0.2);
        var flagWhite = makeMesh(flagWhiteGeo, 0xFFFFFF);
        flagWhite.position.set(OX - 92, OY + 86, OZ - 60);

        // Northwest tower
        var towerNWGeo = new THREE.CylinderGeometry(9, 10, 34, 8);
        var towerNW = makeMesh(towerNWGeo, 0xC8BC9E);
        towerNW.position.set(OX - 100, OY + 39, OZ - 15);

        // Northwest tower conical roof
        var towerNWRoofGeo = new THREE.ConeGeometry(10, 14, 8);
        var towerNWRoof = makeMesh(towerNWRoofGeo, 0x6A7A5A);
        towerNWRoof.position.set(OX - 100, OY + 63, OZ - 15);

        // Northeast tower
        var towerNEGeo = new THREE.CylinderGeometry(9, 10, 30, 8);
        var towerNE = makeMesh(towerNEGeo, 0xC8BC9E);
        towerNE.position.set(OX - 28, OY + 37, OZ - 15);

        // Northeast tower roof
        var towerNERoofGeo = new THREE.ConeGeometry(10, 12, 8);
        var towerNERoof = makeMesh(towerNERoofGeo, 0x6A7A5A);
        towerNERoof.position.set(OX - 28, OY + 58, OZ - 15);

        // South tower (Stenbock)
        var towerSGeo = new THREE.CylinderGeometry(9, 10, 32, 8);
        var towerS = makeMesh(towerSGeo, 0xC8BC9E);
        towerS.position.set(OX - 60, OY + 38, OZ + 20);

        // South tower roof
        var towerSRoofGeo = new THREE.ConeGeometry(10, 13, 8);
        var towerSRoof = makeMesh(towerSRoofGeo, 0x6A7A5A);
        towerSRoof.position.set(OX - 60, OY + 60, OZ + 20);

        // Castle walls — north segment
        var wallNGeo = new THREE.BoxGeometry(72, 18, 4);
        var wallN = makeMesh(wallNGeo, 0xC8BC9E);
        wallN.position.set(OX - 64, OY + 31, OZ - 17);

        // Castle walls — south segment
        var wallSGeo = new THREE.BoxGeometry(72, 18, 4);
        var wallS = makeMesh(wallSGeo, 0xC8BC9E);
        wallS.position.set(OX - 64, OY + 31, OZ + 3);

        // Parliament building (Riigikogu) — pink neoclassical inside castle
        var parliamentGeo = new THREE.BoxGeometry(44, 20, 28);
        var parliament = makeMesh(parliamentGeo, 0xF2C0B8);
        parliament.position.set(OX - 55, OY + 32, OZ - 32);

        // Parliament portico columns
        var col1Geo = new THREE.CylinderGeometry(1.2, 1.2, 20, 8);
        var col1 = makeMesh(col1Geo, 0xF0E8E0);
        col1.position.set(OX - 42, OY + 32, OZ - 22);

        var col2Geo = new THREE.CylinderGeometry(1.2, 1.2, 20, 8);
        var col2 = makeMesh(col2Geo, 0xF0E8E0);
        col2.position.set(OX - 47, OY + 32, OZ - 22);

        var col3Geo = new THREE.CylinderGeometry(1.2, 1.2, 20, 8);
        var col3 = makeMesh(col3Geo, 0xF0E8E0);
        col3.position.set(OX - 52, OY + 32, OZ - 22);

        // Parliament pediment
        var pedimentGeo = new THREE.BoxGeometry(20, 4, 2);
        var pediment = makeMesh(pedimentGeo, 0xF0E8E0);
        pediment.position.set(OX - 47, OY + 43, OZ - 22);
    }

    function buildAlexanderNevskyCathedral() {
        // Cathedral base / nave
        var naveGeo = new THREE.BoxGeometry(36, 24, 44);
        var nave = makeMesh(naveGeo, 0x2A2A5A);
        nave.position.set(OX - 40, OY + 34, OZ - 75);

        // Facade — mosaic panel
        var facadeGeo = new THREE.BoxGeometry(36, 24, 2);
        var facade = makeMesh(facadeGeo, 0xE8E0D0);
        facade.position.set(OX - 40, OY + 34, OZ - 97);

        // Mosaic dark stripe
        var mosaicDarkGeo = new THREE.BoxGeometry(20, 10, 0.5);
        var mosaicDark = makeMesh(mosaicDarkGeo, 0x1A1A3A);
        mosaicDark.position.set(OX - 40, OY + 36, OZ - 98);

        // Mosaic light stripe
        var mosaicLightGeo = new THREE.BoxGeometry(20, 6, 0.5);
        var mosaicLight = makeMesh(mosaicLightGeo, 0xF8F0E8);
        mosaicLight.position.set(OX - 40, OY + 30, OZ - 98);

        // Central drum
        var drumGeo = new THREE.CylinderGeometry(7, 8, 12, 10);
        var drum = makeMesh(drumGeo, 0x2A2A5A);
        drum.position.set(OX - 40, OY + 54, OZ - 75);

        // Central onion dome — main
        var domeGeo = new THREE.SphereGeometry(9, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.65);
        var dome = makeMesh(domeGeo, 0x3A3A7A);
        dome.position.set(OX - 40, OY + 65, OZ - 75);

        // Gold cross on central dome
        var crossVGeo = new THREE.BoxGeometry(0.8, 9, 0.8);
        var crossV = makeMesh(crossVGeo, 0xD4A800);
        crossV.position.set(OX - 40, OY + 78, OZ - 75);

        var crossHGeo = new THREE.BoxGeometry(5, 0.8, 0.8);
        var crossH = makeMesh(crossHGeo, 0xD4A800);
        crossH.position.set(OX - 40, OY + 83, OZ - 75);

        // Small dome NW
        var drumSmNWGeo = new THREE.CylinderGeometry(4, 4.5, 7, 8);
        var drumSmNW = makeMesh(drumSmNWGeo, 0x2A2A5A);
        drumSmNW.position.set(OX - 22, OY + 49, OZ - 62);

        var domeSmNWGeo = new THREE.SphereGeometry(5, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6);
        var domeSmNW = makeMesh(domeSmNWGeo, 0x3A3A7A);
        domeSmNW.position.set(OX - 22, OY + 56, OZ - 62);

        var crossSmNWGeo = new THREE.BoxGeometry(0.5, 5, 0.5);
        var crossSmNW = makeMesh(crossSmNWGeo, 0xD4A800);
        crossSmNW.position.set(OX - 22, OY + 63, OZ - 62);

        // Small dome NE
        var drumSmNEGeo = new THREE.CylinderGeometry(4, 4.5, 7, 8);
        var drumSmNE = makeMesh(drumSmNEGeo, 0x2A2A5A);
        drumSmNE.position.set(OX - 58, OY + 49, OZ - 62);

        var domeSmNEGeo = new THREE.SphereGeometry(5, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6);
        var domeSmNE = makeMesh(domeSmNEGeo, 0x3A3A7A);
        domeSmNE.position.set(OX - 58, OY + 56, OZ - 62);

        var crossSmNEGeo = new THREE.BoxGeometry(0.5, 5, 0.5);
        var crossSmNE = makeMesh(crossSmNEGeo, 0xD4A800);
        crossSmNE.position.set(OX - 58, OY + 63, OZ - 62);

        // Bell tower
        var bellTowerGeo = new THREE.BoxGeometry(10, 30, 10);
        var bellTower = makeMesh(bellTowerGeo, 0x2A2A5A);
        bellTower.position.set(OX - 40, OY + 37, OZ - 104);

        var bellDrumGeo = new THREE.CylinderGeometry(4, 4, 5, 8);
        var bellDrum = makeMesh(bellDrumGeo, 0x2A2A5A);
        bellDrum.position.set(OX - 40, OY + 55, OZ - 104);

        var bellDomeGeo = new THREE.SphereGeometry(5, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6);
        var bellDome = makeMesh(bellDomeGeo, 0x3A3A7A);
        bellDome.position.set(OX - 40, OY + 60, OZ - 104);
    }

    function buildTownHall() {
        // Town hall main body
        var hallBodyGeo = new THREE.BoxGeometry(30, 16, 20);
        var hallBody = makeMesh(hallBodyGeo, 0xD4C8A0);
        hallBody.position.set(OX + 20, OY + 8, OZ + 60);

        // Ground floor arcade
        var arcadeGeo = new THREE.BoxGeometry(30, 5, 22);
        var arcade = makeMesh(arcadeGeo, 0xC8BC90);
        arcade.position.set(OX + 20, OY + 2.5, OZ + 60);

        // Octagonal tower base
        var towerBaseGeo = new THREE.CylinderGeometry(5, 5.5, 26, 8);
        var towerBase = makeMesh(towerBaseGeo, 0xD4C8A0);
        towerBase.position.set(OX + 20, OY + 21, OZ + 56);

        // Octagonal tower upper
        var towerUpperGeo = new THREE.CylinderGeometry(4, 5, 16, 8);
        var towerUpper = makeMesh(towerUpperGeo, 0xC8BC90);
        towerUpper.position.set(OX + 20, OY + 42, OZ + 56);

        // Pointed spire
        var spireGeo = new THREE.ConeGeometry(4, 28, 8);
        var spire = makeMesh(spireGeo, 0x557755);
        spire.position.set(OX + 20, OY + 64, OZ + 56);

        // Weather vane ball
        var weatherVaneGeo = new THREE.SphereGeometry(0.8, 6, 6);
        var weatherVane = makeMesh(weatherVaneGeo, 0xD4A800);
        weatherVane.position.set(OX + 20, OY + 79, OZ + 56);

        // Gothic stepped gables
        var gableGeo = new THREE.BoxGeometry(32, 8, 3);
        var gable = makeMesh(gableGeo, 0xD0C49C);
        gable.position.set(OX + 20, OY + 20, OZ + 49);
    }

    function buildLowerOldTown() {
        // Town Hall Square — cobblestone base
        var squareGeo = new THREE.BoxGeometry(80, 0.5, 60);
        var square = makeMesh(squareGeo, 0xA89870);
        square.position.set(OX + 20, OY + 0.25, OZ + 55);

        // Hanseatic merchant house 1
        var house1Geo = new THREE.BoxGeometry(14, 18, 12);
        var house1 = makeMesh(house1Geo, 0xCC8822);
        house1.position.set(OX + 50, OY + 9, OZ + 40);

        var house1RoofGeo = new THREE.BoxGeometry(15, 6, 14);
        var house1Roof = makeMesh(house1RoofGeo, 0x884422);
        house1Roof.position.set(OX + 50, OY + 21, OZ + 40);

        // Hanseatic merchant house 2
        var house2Geo = new THREE.BoxGeometry(12, 20, 12);
        var house2 = makeMesh(house2Geo, 0xBB7711);
        house2.position.set(OX + 65, OY + 10, OZ + 40);

        var house2RoofGeo = new THREE.BoxGeometry(13, 7, 14);
        var house2Roof = makeMesh(house2RoofGeo, 0x773311);
        house2Roof.position.set(OX + 65, OY + 23, OZ + 40);

        // Hanseatic merchant house 3
        var house3Geo = new THREE.BoxGeometry(13, 16, 12);
        var house3 = makeMesh(house3Geo, 0xDD9933);
        house3.position.set(OX + 50, OY + 8, OZ + 70);

        var house3RoofGeo = new THREE.BoxGeometry(14, 5, 14);
        var house3Roof = makeMesh(house3RoofGeo, 0x994422);
        house3Roof.position.set(OX + 50, OY + 18.5, OZ + 70);

        // Town Apothecary (dating 1422) — distinctive building
        var pharmacyGeo = new THREE.BoxGeometry(10, 14, 10);
        var pharmacy = makeMesh(pharmacyGeo, 0xE8D8A0);
        pharmacy.position.set(OX + 30, OY + 7, OZ + 88);

        var pharmacySignGeo = new THREE.BoxGeometry(8, 2, 0.5);
        var pharmacySign = makeMesh(pharmacySignGeo, 0x228822);
        pharmacySign.position.set(OX + 30, OY + 10, OZ + 93);

        // Street segment 1
        var street1Geo = new THREE.BoxGeometry(8, 0.4, 50);
        var street1 = makeMesh(street1Geo, 0x888870);
        street1.position.set(OX + 80, OY + 0.2, OZ + 60);

        // Street segment 2
        var street2Geo = new THREE.BoxGeometry(50, 0.4, 8);
        var street2 = makeMesh(street2Geo, 0x888870);
        street2.position.set(OX + 50, OY + 0.2, OZ + 100);

        // Alley narrow building
        var alley1Geo = new THREE.BoxGeometry(8, 12, 8);
        var alley1 = makeMesh(alley1Geo, 0xBB8833);
        alley1.position.set(OX + 78, OY + 6, OZ + 70);
    }

    function buildCityWalls() {
        // Main wall segment north
        var wallN1Geo = new THREE.BoxGeometry(120, 14, 4);
        var wallN1 = makeMesh(wallN1Geo, 0xC8B880);
        wallN1.position.set(OX + 60, OY + 7, OZ - 20);

        // Main wall segment east
        var wallE1Geo = new THREE.BoxGeometry(4, 14, 100);
        var wallE1 = makeMesh(wallE1Geo, 0xC8B880);
        wallE1.position.set(OX + 120, OY + 7, OZ + 30);

        // Main wall segment south
        var wallS1Geo = new THREE.BoxGeometry(80, 14, 4);
        var wallS1 = makeMesh(wallS1Geo, 0xC8B880);
        wallS1.position.set(OX + 80, OY + 7, OZ + 110);

        // Viru Gate — twin towers
        var viruTower1Geo = new THREE.CylinderGeometry(6, 7, 24, 8);
        var viruTower1 = makeMesh(viruTower1Geo, 0xC4B47C);
        viruTower1.position.set(OX + 105, OY + 12, OZ + 108);

        var viruTower1RoofGeo = new THREE.ConeGeometry(7, 10, 8);
        var viruTower1Roof = makeMesh(viruTower1RoofGeo, 0x667755);
        viruTower1Roof.position.set(OX + 105, OY + 29, OZ + 108);

        var viruTower2Geo = new THREE.CylinderGeometry(6, 7, 24, 8);
        var viruTower2 = makeMesh(viruTower2Geo, 0xC4B47C);
        viruTower2.position.set(OX + 90, OY + 12, OZ + 108);

        var viruTower2RoofGeo = new THREE.ConeGeometry(7, 10, 8);
        var viruTower2Roof = makeMesh(viruTower2RoofGeo, 0x667755);
        viruTower2Roof.position.set(OX + 90, OY + 29, OZ + 108);

        // Gate arch beam between towers
        var viruArchGeo = new THREE.BoxGeometry(15, 5, 3);
        var viruArch = makeMesh(viruArchGeo, 0xB8A870);
        viruArch.position.set(OX + 97, OY + 22, OZ + 108);

        // Fat Margaret tower (round artillery tower)
        var fatMargaretGeo = new THREE.CylinderGeometry(14, 16, 28, 10);
        var fatMargaret = makeMesh(fatMargaretGeo, 0xC0B080);
        fatMargaret.position.set(OX + 125, OY + 14, OZ - 18);

        var fatMargaretRoofGeo = new THREE.CylinderGeometry(14, 14, 4, 10);
        var fatMargaretRoof = makeMesh(fatMargaretRoofGeo, 0x8A9870);
        fatMargaretRoof.position.set(OX + 125, OY + 30, OZ - 18);

        // Kiek in de Kok tower (large defensive tower)
        var kiekGeo = new THREE.CylinderGeometry(10, 12, 36, 8);
        var kiek = makeMesh(kiekGeo, 0xBAAA78);
        kiek.position.set(OX - 15, OY + 18, OZ - 22);

        var kiekRoofGeo = new THREE.ConeGeometry(11, 14, 8);
        var kiekRoof = makeMesh(kiekRoofGeo, 0x556644);
        kiekRoof.position.set(OX - 15, OY + 43, OZ - 22);

        // Small wall tower 1
        var wt1Geo = new THREE.CylinderGeometry(5, 6, 20, 8);
        var wt1 = makeMesh(wt1Geo, 0xC4B47C);
        wt1.position.set(OX + 20, OY + 10, OZ - 20);

        var wt1RoofGeo = new THREE.ConeGeometry(6, 8, 8);
        var wt1Roof = makeMesh(wt1RoofGeo, 0x556644);
        wt1Roof.position.set(OX + 20, OY + 24, OZ - 20);

        // Small wall tower 2
        var wt2Geo = new THREE.CylinderGeometry(5, 6, 20, 8);
        var wt2 = makeMesh(wt2Geo, 0xC4B47C);
        wt2.position.set(OX + 120, OY + 10, OZ - 20);

        var wt2RoofGeo = new THREE.ConeGeometry(6, 8, 8);
        var wt2Roof = makeMesh(wt2RoofGeo, 0x556644);
        wt2Roof.position.set(OX + 120, OY + 24, OZ - 20);
    }

    function buildKadriorgPalace() {
        // Palace main body
        var palaceBodyGeo = new THREE.BoxGeometry(60, 20, 36);
        var palaceBody = makeMesh(palaceBodyGeo, 0xF5EBD8);
        palaceBody.position.set(OX + 200, OY + 10, OZ + 40);

        // Palace central pavilion
        var palacePavGeo = new THREE.BoxGeometry(20, 26, 10);
        var palacePav = makeMesh(palacePavGeo, 0xF0E5CE);
        palacePav.position.set(OX + 200, OY + 13, OZ + 22);

        // Palace roof
        var palaceRoofGeo = new THREE.BoxGeometry(62, 6, 38);
        var palaceRoof = makeMesh(palaceRoofGeo, 0xCC6644);
        palaceRoof.position.set(OX + 200, OY + 23, OZ + 40);

        // Pavilion roof
        var pavRoofGeo = new THREE.BoxGeometry(22, 8, 12);
        var pavRoof = makeMesh(pavRoofGeo, 0xCC6644);
        pavRoof.position.set(OX + 200, OY + 32, OZ + 22);

        // Palace columns left
        var pCol1Geo = new THREE.CylinderGeometry(1, 1, 24, 6);
        var pCol1 = makeMesh(pCol1Geo, 0xEEE0C8);
        pCol1.position.set(OX + 192, OY + 12, OZ + 20);

        var pCol2Geo = new THREE.CylinderGeometry(1, 1, 24, 6);
        var pCol2 = makeMesh(pCol2Geo, 0xEEE0C8);
        pCol2.position.set(OX + 196, OY + 12, OZ + 20);

        var pCol3Geo = new THREE.CylinderGeometry(1, 1, 24, 6);
        var pCol3 = makeMesh(pCol3Geo, 0xEEE0C8);
        pCol3.position.set(OX + 204, OY + 12, OZ + 20);

        var pCol4Geo = new THREE.CylinderGeometry(1, 1, 24, 6);
        var pCol4 = makeMesh(pCol4Geo, 0xEEE0C8);
        pCol4.position.set(OX + 208, OY + 12, OZ + 20);

        // Rose garden wall
        var gardenWall1Geo = new THREE.BoxGeometry(60, 3, 2);
        var gardenWall1 = makeMesh(gardenWall1Geo, 0xDDCCAA);
        gardenWall1.position.set(OX + 200, OY + 1.5, OZ + 0);

        var gardenWall2Geo = new THREE.BoxGeometry(2, 3, 40);
        var gardenWall2 = makeMesh(gardenWall2Geo, 0xDDCCAA);
        gardenWall2.position.set(OX + 170, OY + 1.5, OZ + 20);

        // KUMU art museum — boxy modern
        var kumuGeo = new THREE.BoxGeometry(50, 18, 30);
        var kumu = makeMesh(kumuGeo, 0xCCBBA0);
        kumu.position.set(OX + 240, OY + 9, OZ + 40);

        var kumuRoofGeo = new THREE.BoxGeometry(52, 4, 32);
        var kumuRoof = makeMesh(kumuRoofGeo, 0xBBAA90);
        kumuRoof.position.set(OX + 240, OY + 20, OZ + 40);
    }

    function buildBalticSeaHarbour() {
        // Sea surface
        var seaGeo = new THREE.BoxGeometry(300, 1, 160);
        var sea = makeMesh(seaGeo, 0x1A4A6A);
        sea.position.set(OX + 50, OY - 1, OZ - 140);

        // Pier / quay
        var pierGeo = new THREE.BoxGeometry(20, 2, 80);
        var pier = makeMesh(pierGeo, 0x887766);
        pier.position.set(OX + 60, OY + 1, OZ - 100);

        // Ferry vessel 1 — hull
        var ferry1HullGeo = new THREE.BoxGeometry(24, 6, 60);
        var ferry1Hull = makeMesh(ferry1HullGeo, 0xEEEECC);
        ferry1Hull.position.set(OX + 40, OY + 2, OZ - 140);

        // Ferry 1 superstructure
        var ferry1SuperGeo = new THREE.BoxGeometry(20, 10, 40);
        var ferry1Super = makeMesh(ferry1SuperGeo, 0xFFFFEE);
        ferry1Super.position.set(OX + 40, OY + 10, OZ - 140);

        // Ferry 1 funnel
        var ferry1FunnelGeo = new THREE.CylinderGeometry(2.5, 3, 8, 8);
        var ferry1Funnel = makeMesh(ferry1FunnelGeo, 0xCC2222);
        ferry1Funnel.position.set(OX + 44, OY + 19, OZ - 145);

        // Port warehouse 1
        var ware1Geo = new THREE.BoxGeometry(40, 16, 20);
        var ware1 = makeMesh(ware1Geo, 0xAA9988);
        ware1.position.set(OX + 100, OY + 8, OZ - 85);

        var ware1RoofGeo = new THREE.BoxGeometry(41, 5, 21);
        var ware1Roof = makeMesh(ware1RoofGeo, 0x776655);
        ware1Roof.position.set(OX + 100, OY + 18.5, OZ - 85);

        // Port warehouse 2
        var ware2Geo = new THREE.BoxGeometry(36, 14, 18);
        var ware2 = makeMesh(ware2Geo, 0xBBAA99);
        ware2.position.set(OX + 150, OY + 7, OZ - 85);

        // Crane structure
        var craneMastGeo = new THREE.BoxGeometry(3, 30, 3);
        var craneMast = makeMesh(craneMastGeo, 0x888888);
        craneMast.position.set(OX + 80, OY + 15, OZ - 90);

        var craneArmGeo = new THREE.BoxGeometry(20, 2, 2);
        var craneArm = makeMesh(craneArmGeo, 0x888888);
        craneArm.position.set(OX + 70, OY + 30, OZ - 90);

        // Lighthouse
        var lighthouseGeo = new THREE.CylinderGeometry(3, 4, 28, 8);
        var lighthouse = makeMesh(lighthouseGeo, 0xEEEEEE);
        lighthouse.position.set(OX - 20, OY + 14, OZ - 130);

        var lighthouseTopGeo = new THREE.CylinderGeometry(4, 4, 4, 8);
        var lighthouseTop = makeMesh(lighthouseTopGeo, 0xDD3333);
        lighthouseTop.position.set(OX - 20, OY + 30, OZ - 130);

        var lighthouseCapGeo = new THREE.ConeGeometry(4, 6, 8);
        var lighthouseCap = makeMesh(lighthouseCapGeo, 0xDD3333);
        lighthouseCap.position.set(OX - 20, OY + 35, OZ - 130);
    }

    function buildPiritaConventRuins() {
        // Ruins north wall (partial height)
        var ruinNGeo = new THREE.BoxGeometry(28, 20, 3);
        var ruinN = makeMesh(ruinNGeo, 0xD4C8A0);
        ruinN.position.set(OX - 160, OY + 10, OZ - 60);

        // Ruins east wall (collapsed)
        var ruinEGeo = new THREE.BoxGeometry(3, 12, 30);
        var ruinE = makeMesh(ruinEGeo, 0xC8BC94);
        ruinE.position.set(OX - 146, OY + 6, OZ - 45);

        // Ruins west wall (tall)
        var ruinWGeo = new THREE.BoxGeometry(3, 22, 30);
        var ruinW = makeMesh(ruinWGeo, 0xD0C498);
        ruinW.position.set(OX - 174, OY + 11, OZ - 45);

        // Gothic window arch remnant
        var archBaseGeo = new THREE.BoxGeometry(8, 14, 2);
        var archBase = makeMesh(archBaseGeo, 0xC8BC94);
        archBase.position.set(OX - 160, OY + 7, OZ - 59);

        var archTopGeo = new THREE.SphereGeometry(4, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.5);
        var archTop = makeMesh(archTopGeo, 0xC8BC94);
        archTop.position.set(OX - 160, OY + 14, OZ - 59);

        // Open-air stage platform
        var stageGeo = new THREE.BoxGeometry(30, 1, 20);
        var stage = makeMesh(stageGeo, 0xAA9966);
        stage.position.set(OX - 160, OY + 0.5, OZ - 30);

        // Audience terracing
        var terraceGeo = new THREE.BoxGeometry(40, 2, 30);
        var terrace = makeMesh(terraceGeo, 0x998855);
        terrace.position.set(OX - 160, OY + 1, OZ - 5);
    }

    function buildRotermannQuarter() {
        // Old limestone mill building
        var mill1Geo = new THREE.BoxGeometry(22, 18, 14);
        var mill1 = makeMesh(mill1Geo, 0x888888);
        mill1.position.set(OX + 140, OY + 9, OZ + 40);

        // Modern glass insertion on mill
        var glassInsert1Geo = new THREE.BoxGeometry(22, 8, 2);
        var glassInsert1 = makeMesh(glassInsert1Geo, 0x99BBCC);
        glassInsert1.position.set(OX + 140, OY + 16, OZ + 33);

        // Old warehouse converted
        var warehouse2Geo = new THREE.BoxGeometry(18, 14, 22);
        var warehouse2 = makeMesh(warehouse2Geo, 0x7A7A7A);
        warehouse2.position.set(OX + 166, OY + 7, OZ + 40);

        // Modern glass block addition
        var glassBlock1Geo = new THREE.BoxGeometry(12, 10, 10);
        var glassBlock1 = makeMesh(glassBlock1Geo, 0x88AACC);
        glassBlock1.position.set(OX + 162, OY + 12, OZ + 30);

        // Limestone industrial chimney
        var chimneyGeo = new THREE.CylinderGeometry(2, 3, 26, 8);
        var chimney = makeMesh(chimneyGeo, 0x777777);
        chimney.position.set(OX + 154, OY + 13, OZ + 45);

        // Modern mixed-use building
        var modernBlock1Geo = new THREE.BoxGeometry(16, 20, 14);
        var modernBlock1 = makeMesh(modernBlock1Geo, 0x999999);
        modernBlock1.position.set(OX + 140, OY + 10, OZ + 60);

        var modernGlass1Geo = new THREE.BoxGeometry(16, 20, 2);
        var modernGlass1 = makeMesh(modernGlass1Geo, 0xAABBCC);
        modernGlass1.position.set(OX + 140, OY + 10, OZ + 53);
    }

    function buildLinnahall() {
        // Main vast concrete terrace base
        var linnahallBaseGeo = new THREE.BoxGeometry(120, 8, 80);
        var linnahallBase = makeMesh(linnahallBaseGeo, 0x999999);
        linnahallBase.position.set(OX - 20, OY + 4, OZ - 170);

        // Upper terrace level 1
        var terrace1Geo = new THREE.BoxGeometry(100, 8, 65);
        var terrace1 = makeMesh(terrace1Geo, 0x929292);
        terrace1.position.set(OX - 20, OY + 12, OZ - 170);

        // Upper terrace level 2
        var terrace2Geo = new THREE.BoxGeometry(80, 8, 50);
        var terrace2 = makeMesh(terrace2Geo, 0x8A8A8A);
        terrace2.position.set(OX - 20, OY + 20, OZ - 170);

        // Upper terrace level 3
        var terrace3Geo = new THREE.BoxGeometry(60, 8, 36);
        var terrace3 = makeMesh(terrace3Geo, 0x828282);
        terrace3.position.set(OX - 20, OY + 28, OZ - 170);

        // Concert hall box at top
        var concertHallGeo = new THREE.BoxGeometry(44, 16, 26);
        var concertHall = makeMesh(concertHallGeo, 0x7A7A7A);
        concertHall.position.set(OX - 20, OY + 40, OZ - 170);

        // Entrance ramps
        var ramp1Geo = new THREE.BoxGeometry(16, 2, 40);
        var ramp1 = makeMesh(ramp1Geo, 0x909090);
        ramp1.rotation.x = -0.12;
        ramp1.position.set(OX + 30, OY + 6, OZ - 152);

        var ramp2Geo = new THREE.BoxGeometry(16, 2, 40);
        var ramp2 = makeMesh(ramp2Geo, 0x909090);
        ramp2.rotation.x = -0.12;
        ramp2.position.set(OX - 70, OY + 6, OZ - 152);
    }

    function buildGround() {
        // Ground plane for the whole area using box slabs
        var ground1Geo = new THREE.BoxGeometry(400, 1, 300);
        var ground1 = makeMesh(ground1Geo, 0x7A8060);
        ground1.position.set(OX + 50, OY - 0.5, OZ);

        // Toompea hill ground
        var toompeaGroundGeo = new THREE.BoxGeometry(160, 1, 120);
        var toompeaGround = makeMesh(toompeaGroundGeo, 0x8A8A70);
        toompeaGround.position.set(OX - 60, OY + 21.5, OZ - 40);
    }

    function build() {
        buildGround();
        buildToompeaCastle();
        buildAlexanderNevskyCathedral();
        buildTownHall();
        buildLowerOldTown();
        buildCityWalls();
        buildKadriorgPalace();
        buildBalticSeaHarbour();
        buildPiritaConventRuins();
        buildRotermannQuarter();
        buildLinnahall();
    }

    function update(delta) {
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
