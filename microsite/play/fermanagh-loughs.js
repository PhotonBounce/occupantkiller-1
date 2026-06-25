window.FermanaghLoughs = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 19320;
    var CY = 0;
    var CZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, mat) {
        var mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildLakes() {
        // Lower Lough Erne — large blue lake body
        var lowerLakeMat = new THREE.MeshLambertMaterial({ color: 0x006994 });
        var lowerLakeGeo = new THREE.BoxGeometry(900, 2, 600);
        var lowerLake = makeMesh(lowerLakeGeo, lowerLakeMat);
        lowerLake.position.set(CX - 200, CY - 1, CZ - 100);
        addMesh(lowerLake);

        // Lower Lough Erne second segment
        var lowerLake2Geo = new THREE.BoxGeometry(400, 2, 300);
        var lowerLake2 = makeMesh(lowerLake2Geo, lowerLakeMat);
        lowerLake2.position.set(CX + 350, CY - 1, CZ + 80);
        addMesh(lowerLake2);

        // Upper Lough Erne — connected lake to the south-east
        var upperLakeMat = new THREE.MeshLambertMaterial({ color: 0x006994 });
        var upperLakeGeo = new THREE.BoxGeometry(500, 2, 700);
        var upperLake = makeMesh(upperLakeGeo, upperLakeMat);
        upperLake.position.set(CX + 600, CY - 1, CZ + 400);
        addMesh(upperLake);

        // Upper Lough Erne northern extension
        var upperLake2Geo = new THREE.BoxGeometry(200, 2, 200);
        var upperLake2 = makeMesh(upperLake2Geo, upperLakeMat);
        upperLake2.position.set(CX + 480, CY - 1, CZ + 150);
        addMesh(upperLake2);

        // River Erne connecting upper and lower
        var riverMat = new THREE.MeshLambertMaterial({ color: 0x006994 });
        var riverGeo = new THREE.BoxGeometry(80, 2, 200);
        var river = makeMesh(riverGeo, riverMat);
        river.position.set(CX + 420, CY - 1, CZ + 250);
        addMesh(river);

        // River bend segment
        var riverBendGeo = new THREE.BoxGeometry(160, 2, 60);
        var riverBend = makeMesh(riverBendGeo, riverMat);
        riverBend.position.set(CX + 490, CY - 1, CZ + 220);
        addMesh(riverBend);
    }

    function buildDevenishIsland() {
        // Island ground
        var islandMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var islandGeo = new THREE.BoxGeometry(60, 4, 70);
        var island = makeMesh(islandGeo, islandMat);
        island.position.set(CX - 80, CY + 1, CZ - 60);
        addMesh(island);

        // Round tower — CylinderGeometry, height 20
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
        var towerGeo = new THREE.CylinderGeometry(2.5, 3, 20, 10);
        var tower = makeMesh(towerGeo, towerMat);
        tower.position.set(CX - 80, CY + 12, CZ - 60);
        addMesh(tower);

        // Round tower conical cap
        var capMat = new THREE.MeshLambertMaterial({ color: 0x6B6B6B });
        var capGeo = new THREE.ConeGeometry(3, 5, 10);
        var cap = makeMesh(capGeo, capMat);
        cap.position.set(CX - 80, CY + 24.5, CZ - 60);
        addMesh(cap);

        // St Molaise church ruin — north wall
        var ruinMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var northWallGeo = new THREE.BoxGeometry(18, 6, 1.5);
        var northWall = makeMesh(northWallGeo, ruinMat);
        northWall.position.set(CX - 75, CY + 3, CZ - 45);
        addMesh(northWall);

        // South wall
        var southWallGeo = new THREE.BoxGeometry(18, 5, 1.5);
        var southWall = makeMesh(southWallGeo, ruinMat);
        southWall.position.set(CX - 75, CY + 2.5, CZ - 35);
        addMesh(southWall);

        // East wall partial ruin
        var eastWallGeo = new THREE.BoxGeometry(1.5, 4, 10);
        var eastWall = makeMesh(eastWallGeo, ruinMat);
        eastWall.position.set(CX - 66, CY + 2, CZ - 40);
        addMesh(eastWall);

        // Medieval priory remains — larger ruin cluster
        var prioryBaseGeo = new THREE.BoxGeometry(22, 2, 16);
        var prioryMat = new THREE.MeshLambertMaterial({ color: 0x7D6B4F });
        var prioryBase = makeMesh(prioryBaseGeo, prioryMat);
        prioryBase.position.set(CX - 90, CY + 1, CZ - 72);
        addMesh(prioryBase);

        var prioryWall1Geo = new THREE.BoxGeometry(22, 5, 1.5);
        var prioryWall1 = makeMesh(prioryWall1Geo, prioryMat);
        prioryWall1.position.set(CX - 90, CY + 3.5, CZ - 80);
        addMesh(prioryWall1);

        var prioryWall2Geo = new THREE.BoxGeometry(1.5, 7, 16);
        var prioryWall2 = makeMesh(prioryWall2Geo, prioryMat);
        prioryWall2.position.set(CX - 101, CY + 4.5, CZ - 72);
        addMesh(prioryWall2);
    }

    function buildBoaIsland() {
        // Boa Island ground
        var boaMat = new THREE.MeshLambertMaterial({ color: 0x2E7D32 });
        var boaGeo = new THREE.BoxGeometry(120, 4, 50);
        var boaIsland = makeMesh(boaGeo, boaMat);
        boaIsland.position.set(CX - 350, CY + 1, CZ - 140);
        addMesh(boaIsland);

        // Janus figure 1 — body (box)
        var figureMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var figure1BodyGeo = new THREE.BoxGeometry(3, 5, 2);
        var figure1Body = makeMesh(figure1BodyGeo, figureMat);
        figure1Body.position.set(CX - 345, CY + 4.5, CZ - 140);
        addMesh(figure1Body);

        // Janus figure 1 — double head (sphere for each face)
        var head1aGeo = new THREE.SphereGeometry(1.5, 8, 8);
        var head1a = makeMesh(head1aGeo, figureMat);
        head1a.position.set(CX - 344.5, CY + 9, CZ - 140);
        addMesh(head1a);

        var head1bGeo = new THREE.SphereGeometry(1.5, 8, 8);
        var head1b = makeMesh(head1bGeo, figureMat);
        head1b.position.set(CX - 345.5, CY + 9, CZ - 140);
        addMesh(head1b);

        // Janus figure 2 — body
        var figure2BodyGeo = new THREE.BoxGeometry(3, 4.5, 2);
        var figure2Body = makeMesh(figure2BodyGeo, figureMat);
        figure2Body.position.set(CX - 355, CY + 4.25, CZ - 140);
        addMesh(figure2Body);

        // Janus figure 2 — double head
        var head2aGeo = new THREE.SphereGeometry(1.4, 8, 8);
        var head2a = makeMesh(head2aGeo, figureMat);
        head2a.position.set(CX - 354.5, CY + 8.3, CZ - 140);
        addMesh(head2a);

        var head2bGeo = new THREE.SphereGeometry(1.4, 8, 8);
        var head2b = makeMesh(head2bGeo, figureMat);
        head2b.position.set(CX - 355.5, CY + 8.3, CZ - 140);
        addMesh(head2b);
    }

    function buildMarbleArchCaves() {
        // Hillside mass — dark earth tones
        var hillMat = new THREE.MeshLambertMaterial({ color: 0x2C1A0E });
        var hillGeo = new THREE.BoxGeometry(120, 60, 100);
        var hill = makeMesh(hillGeo, hillMat);
        hill.position.set(CX - 500, CY + 30, CZ + 200);
        addMesh(hill);

        // Cave entrance arch sides (two box pillars)
        var caveEntranceMat = new THREE.MeshLambertMaterial({ color: 0x1A0F06 });
        var pillarLGeo = new THREE.BoxGeometry(5, 14, 8);
        var pillarL = makeMesh(pillarLGeo, caveEntranceMat);
        pillarL.position.set(CX - 493, CY + 7, CZ + 200);
        addMesh(pillarL);

        var pillarRGeo = new THREE.BoxGeometry(5, 14, 8);
        var pillarR = makeMesh(pillarRGeo, caveEntranceMat);
        pillarR.position.set(CX - 507, CY + 7, CZ + 200);
        addMesh(pillarR);

        // Cave entrance top lintel
        var lintelGeo = new THREE.BoxGeometry(20, 4, 8);
        var lintel = makeMesh(lintelGeo, caveEntranceMat);
        lintel.position.set(CX - 500, CY + 15, CZ + 200);
        addMesh(lintel);

        // Cave interior floor
        var caveFloorMat = new THREE.MeshLambertMaterial({ color: 0x3C2415 });
        var caveFloorGeo = new THREE.BoxGeometry(60, 1, 40);
        var caveFloor = makeMesh(caveFloorGeo, caveFloorMat);
        caveFloor.position.set(CX - 530, CY + 0.5, CZ + 200);
        addMesh(caveFloor);

        // Cave ceiling
        var caveCeilGeo = new THREE.BoxGeometry(60, 2, 40);
        var caveCeilMat = new THREE.MeshLambertMaterial({ color: 0x241208 });
        var caveCeil = makeMesh(caveCeilGeo, caveCeilMat);
        caveCeil.position.set(CX - 530, CY + 13, CZ + 200);
        addMesh(caveCeil);

        // Stalactites — ConeGeometry hanging from ceiling (point downward)
        var stalMat = new THREE.MeshLambertMaterial({ color: 0x5C3D1E });
        var stal1Geo = new THREE.ConeGeometry(0.8, 6, 6);
        var stal1 = makeMesh(stal1Geo, stalMat);
        stal1.rotation.z = Math.PI;
        stal1.position.set(CX - 515, CY + 9, CZ + 195);
        addMesh(stal1);

        var stal2Geo = new THREE.ConeGeometry(0.6, 5, 6);
        var stal2 = makeMesh(stal2Geo, stalMat);
        stal2.rotation.z = Math.PI;
        stal2.position.set(CX - 525, CY + 9, CZ + 205);
        addMesh(stal2);

        var stal3Geo = new THREE.ConeGeometry(1.0, 7, 6);
        var stal3 = makeMesh(stal3Geo, stalMat);
        stal3.rotation.z = Math.PI;
        stal3.position.set(CX - 535, CY + 9, CZ + 198);
        addMesh(stal3);

        var stal4Geo = new THREE.ConeGeometry(0.7, 4, 6);
        var stal4 = makeMesh(stal4Geo, stalMat);
        stal4.rotation.z = Math.PI;
        stal4.position.set(CX - 545, CY + 9, CZ + 202);
        addMesh(stal4);

        var stal5Geo = new THREE.ConeGeometry(0.5, 5.5, 6);
        var stal5 = makeMesh(stal5Geo, stalMat);
        stal5.rotation.z = Math.PI;
        stal5.position.set(CX - 520, CY + 9, CZ + 210);
        addMesh(stal5);

        // Stalagmites rising from floor
        var stagMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var stag1Geo = new THREE.ConeGeometry(0.7, 4, 6);
        var stag1 = makeMesh(stag1Geo, stagMat);
        stag1.position.set(CX - 518, CY + 2, CZ + 196);
        addMesh(stag1);

        var stag2Geo = new THREE.ConeGeometry(0.5, 3, 6);
        var stag2 = makeMesh(stag2Geo, stagMat);
        stag2.position.set(CX - 540, CY + 1.5, CZ + 204);
        addMesh(stag2);
    }

    function buildCuilcaghMountain() {
        // Base mountain — stepped cliffs
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
        var base1Geo = new THREE.BoxGeometry(160, 30, 120);
        var base1 = makeMesh(base1Geo, rockMat);
        base1.position.set(CX - 600, CY + 15, CZ - 300);
        addMesh(base1);

        // Second step
        var step2Mat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var step2Geo = new THREE.BoxGeometry(120, 20, 90);
        var step2 = makeMesh(step2Geo, step2Mat);
        step2.position.set(CX - 600, CY + 40, CZ - 300);
        addMesh(step2);

        // Third step
        var step3Mat = new THREE.MeshLambertMaterial({ color: 0x3D3D3D });
        var step3Geo = new THREE.BoxGeometry(90, 18, 65);
        var step3 = makeMesh(step3Geo, step3Mat);
        step3.position.set(CX - 600, CY + 59, CZ - 300);
        addMesh(step3);

        // Flat plateau top — the "Stairway to Heaven" summit
        var plateauMat = new THREE.MeshLambertMaterial({ color: 0x6B6B3A });
        var plateauGeo = new THREE.BoxGeometry(100, 5, 70);
        var plateau = makeMesh(plateauGeo, plateauMat);
        plateau.position.set(CX - 600, CY + 79.5, CZ - 300);
        addMesh(plateau);

        // Boardwalk on plateau
        var boardwalkMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        var boardwalkGeo = new THREE.BoxGeometry(60, 0.8, 3);
        var boardwalk = makeMesh(boardwalkGeo, boardwalkMat);
        boardwalk.position.set(CX - 600, CY + 82.4, CZ - 300);
        addMesh(boardwalk);

        // Boardwalk railing left
        var railingMat = new THREE.MeshLambertMaterial({ color: 0x5C4A1E });
        var rail1Geo = new THREE.BoxGeometry(60, 1.2, 0.3);
        var rail1 = makeMesh(rail1Geo, railingMat);
        rail1.position.set(CX - 600, CY + 83.8, CZ - 298.5);
        addMesh(rail1);

        var rail2Geo = new THREE.BoxGeometry(60, 1.2, 0.3);
        var rail2 = makeMesh(rail2Geo, railingMat);
        rail2.position.set(CX - 600, CY + 83.8, CZ - 301.5);
        addMesh(rail2);

        // Green hillside slopes with peat bog colouring
        var bogMat = new THREE.MeshLambertMaterial({ color: 0x4A6741 });
        var bog1Geo = new THREE.BoxGeometry(200, 6, 160);
        var bog1 = makeMesh(bog1Geo, bogMat);
        bog1.position.set(CX - 600, CY + 2, CZ - 300);
        addMesh(bog1);
    }

    function buildBelleek() {
        // Belleek village ground along river
        var villageMat = new THREE.MeshLambertMaterial({ color: 0x7B7B4A });
        var villageGeo = new THREE.BoxGeometry(80, 2, 50);
        var village = makeMesh(villageGeo, villageMat);
        village.position.set(CX - 700, CY + 1, CZ - 30);
        addMesh(village);

        // Belleek Pottery factory — white building
        var potteryMat = new THREE.MeshLambertMaterial({ color: 0xFFFFF0 });
        var factoryGeo = new THREE.BoxGeometry(30, 12, 18);
        var factory = makeMesh(factoryGeo, potteryMat);
        factory.position.set(CX - 700, CY + 7, CZ - 30);
        addMesh(factory);

        // Factory roof
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xE0E0C8 });
        var roofGeo = new THREE.BoxGeometry(32, 3, 20);
        var roof = makeMesh(roofGeo, roofMat);
        roof.position.set(CX - 700, CY + 14.5, CZ - 30);
        addMesh(roof);

        // Factory chimney
        var chimneyMat = new THREE.MeshLambertMaterial({ color: 0xD0D0C0 });
        var chimneyGeo = new THREE.CylinderGeometry(1.5, 2, 18, 8);
        var chimney = makeMesh(chimneyGeo, chimneyMat);
        chimney.position.set(CX - 690, CY + 18, CZ - 30);
        addMesh(chimney);

        // Village cottages
        var cottageMat = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
        var cottage1Geo = new THREE.BoxGeometry(8, 6, 6);
        var cottage1 = makeMesh(cottage1Geo, cottageMat);
        cottage1.position.set(CX - 720, CY + 4, CZ - 25);
        addMesh(cottage1);

        var cottage2Geo = new THREE.BoxGeometry(8, 6, 6);
        var cottage2 = makeMesh(cottage2Geo, cottageMat);
        cottage2.position.set(CX - 730, CY + 4, CZ - 38);
        addMesh(cottage2);

        // Cottage roofs
        var cotRoofMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var cRoof1Geo = new THREE.BoxGeometry(9, 2, 7);
        var cRoof1 = makeMesh(cRoof1Geo, cotRoofMat);
        cRoof1.position.set(CX - 720, CY + 8, CZ - 25);
        addMesh(cRoof1);

        var cRoof2Geo = new THREE.BoxGeometry(9, 2, 7);
        var cRoof2 = makeMesh(cRoof2Geo, cotRoofMat);
        cRoof2.position.set(CX - 730, CY + 8, CZ - 38);
        addMesh(cRoof2);

        // River Erne at Belleek
        var belleekRiverMat = new THREE.MeshLambertMaterial({ color: 0x006994 });
        var belleekRiverGeo = new THREE.BoxGeometry(200, 2, 30);
        var belleekRiver = makeMesh(belleekRiverGeo, belleekRiverMat);
        belleekRiver.position.set(CX - 700, CY - 1, CZ - 10);
        addMesh(belleekRiver);
    }

    function buildWhiteIsland() {
        // White Island ground
        var whiteIslandMat = new THREE.MeshLambertMaterial({ color: 0x3A7A3A });
        var whiteIslandGeo = new THREE.BoxGeometry(55, 4, 40);
        var whiteIsland = makeMesh(whiteIslandGeo, whiteIslandMat);
        whiteIsland.position.set(CX - 250, CY + 1, CZ - 180);
        addMesh(whiteIsland);

        // Church ruin walls
        var churchMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var churchNWallGeo = new THREE.BoxGeometry(24, 7, 1.5);
        var churchNWall = makeMesh(churchNWallGeo, churchMat);
        churchNWall.position.set(CX - 250, CY + 5.5, CZ - 170);
        addMesh(churchNWall);

        var churchSWallGeo = new THREE.BoxGeometry(24, 5, 1.5);
        var churchSWall = makeMesh(churchSWallGeo, churchMat);
        churchSWall.position.set(CX - 250, CY + 4.5, CZ - 182);
        addMesh(churchSWall);

        var churchEWallGeo = new THREE.BoxGeometry(1.5, 8, 12);
        var churchEWall = makeMesh(churchEWallGeo, churchMat);
        churchEWall.position.set(CX - 238, CY + 6, CZ - 176);
        addMesh(churchEWall);

        // 8 carved stone figures lined up inside church ruins (box bodies + sphere heads)
        var figureMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var figurePositions = [
            CX - 260, CX - 257, CX - 254, CX - 251,
            CX - 248, CX - 245, CX - 242, CX - 239
        ];

        for (var fi = 0; fi < 8; fi++) {
            var fbGeo = new THREE.BoxGeometry(1.8, 4, 1.2);
            var fb = makeMesh(fbGeo, figureMat);
            fb.position.set(figurePositions[fi], CY + 4, CZ - 176);
            addMesh(fb);

            var fhGeo = new THREE.SphereGeometry(0.9, 6, 6);
            var fh = makeMesh(fhGeo, figureMat);
            fh.position.set(figurePositions[fi], CY + 7, CZ - 176);
            addMesh(fh);
        }
    }

    function buildCruisers() {
        var hullMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var deckMat = new THREE.MeshLambertMaterial({ color: 0xF0F0F0 });
        var cabinMat = new THREE.MeshLambertMaterial({ color: 0xE8E8E8 });

        // Cruiser 1
        var hull1Geo = new THREE.BoxGeometry(14, 3, 5);
        var hull1 = makeMesh(hull1Geo, hullMat);
        hull1.position.set(CX - 150, CY + 1.5, CZ - 80);
        addMesh(hull1);

        var cabin1Geo = new THREE.BoxGeometry(7, 3, 4);
        var cabin1 = makeMesh(cabin1Geo, cabinMat);
        cabin1.position.set(CX - 150, CY + 4.5, CZ - 80);
        addMesh(cabin1);

        // Cruiser 2
        var hull2Geo = new THREE.BoxGeometry(12, 3, 4.5);
        var hull2 = makeMesh(hull2Geo, hullMat);
        hull2.position.set(CX + 50, CY + 1.5, CZ - 90);
        addMesh(hull2);

        var cabin2Geo = new THREE.BoxGeometry(6, 2.8, 3.5);
        var cabin2 = makeMesh(cabin2Geo, cabinMat);
        cabin2.position.set(CX + 50, CY + 4.4, CZ - 90);
        addMesh(cabin2);

        // Cruiser 3 — Upper Erne
        var hull3Geo = new THREE.BoxGeometry(16, 3, 5.5);
        var hull3 = makeMesh(hull3Geo, hullMat);
        hull3.position.set(CX + 600, CY + 1.5, CZ + 350);
        addMesh(hull3);

        var cabin3Geo = new THREE.BoxGeometry(8, 3.2, 4.5);
        var cabin3 = makeMesh(cabin3Geo, cabinMat);
        cabin3.position.set(CX + 600, CY + 4.6, CZ + 350);
        addMesh(cabin3);

        // Cruiser 4 — near Belleek
        var hull4Geo = new THREE.BoxGeometry(13, 3, 4.5);
        var hull4 = makeMesh(hull4Geo, hullMat);
        hull4.position.set(CX - 680, CY + 1.5, CZ - 10);
        addMesh(hull4);

        var cabin4Geo = new THREE.BoxGeometry(6.5, 2.8, 3.5);
        var cabin4 = makeMesh(cabin4Geo, cabinMat);
        cabin4.position.set(CX - 680, CY + 4.4, CZ - 10);
        addMesh(cabin4);

        // Deck boards on cruiser 1
        var deck1Geo = new THREE.BoxGeometry(14, 0.5, 5);
        var deck1 = makeMesh(deck1Geo, deckMat);
        deck1.position.set(CX - 150, CY + 3.25, CZ - 80);
        addMesh(deck1);
    }

    function buildScatteredIslands() {
        var islandMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var darkIslandMat = new THREE.MeshLambertMaterial({ color: 0x1A6B1A });
        var lightIslandMat = new THREE.MeshLambertMaterial({ color: 0x2EAA2E });

        // Grid of small scattered islands throughout the loughs
        // Lower Erne islands
        var lowerIslands = [
            [-320, -60], [-280, -120], [-240, 30], [-200, -150],
            [-160, 60], [-120, -40], [-100, 110], [-60, -130],
            [-20, 80], [20, -70], [60, 100], [100, -110],
            [140, 50], [180, -90], [220, 30], [260, -140],
            [300, 80], [-400, -80], [-440, 40], [-380, 100],
            [-340, -170], [-260, 150], [-220, -180], [-180, 120],
            [-140, -160], [-80, 140], [-40, -100], [0, 120],
            [40, -140], [80, 60], [120, -30], [160, 130],
            [200, -50], [240, 100], [280, -120], [320, 40]
        ];

        for (var li = 0; li < lowerIslands.length; li++) {
            var lx = lowerIslands[li][0];
            var lz = lowerIslands[li][1];
            var lsize = 4 + (li % 5) * 3;
            var ldepth = 3 + (li % 3) * 2;
            var lmat = (li % 3 === 0) ? darkIslandMat : ((li % 3 === 1) ? islandMat : lightIslandMat);
            var lgeo = new THREE.BoxGeometry(lsize, 3, ldepth);
            var lisland = makeMesh(lgeo, lmat);
            lisland.position.set(CX + lx, CY + 1.5, CZ + lz);
            addMesh(lisland);
        }

        // Upper Erne islands
        var upperIslands = [
            [550, 280], [580, 340], [620, 420], [660, 300],
            [700, 380], [640, 460], [560, 400], [590, 260],
            [670, 440], [710, 320], [730, 280], [720, 460],
            [540, 360], [760, 350], [680, 500], [610, 510],
            [650, 370], [570, 450], [700, 250], [740, 420]
        ];

        for (var ui = 0; ui < upperIslands.length; ui++) {
            var ux = upperIslands[ui][0];
            var uz = upperIslands[ui][1];
            var usize = 5 + (ui % 4) * 2;
            var udepth = 4 + (ui % 3) * 2;
            var umat = (ui % 2 === 0) ? islandMat : darkIslandMat;
            var ugeo = new THREE.BoxGeometry(usize, 3, udepth);
            var uisland = makeMesh(ugeo, umat);
            uisland.position.set(CX + ux, CY + 1.5, CZ + uz);
            addMesh(uisland);
        }

        // More islands to reach 365+ total — broader scatter
        var extraIslands = [
            [-450, -200], [-420, 180], [-390, -140], [-360, 220],
            [-310, -220], [-180, 200], [-140, -220], [340, 120],
            [380, -60], [400, 160], [430, -100], [460, 80],
            [500, 200], [520, -80], [-50, 180], [-70, -200],
            [-110, 170], [-130, -180], [10, 160], [30, -180],
            [70, 150], [90, -160], [130, 140], [150, -150],
            [190, 120], [210, -130], [250, 110], [270, -120],
            [310, 100], [330, -110], [370, 90], [390, -90],
            [410, 80], [430, -70], [450, 70], [470, -50],
            [-450, 100], [-430, -180], [-410, 140], [-370, -160],
            [-350, 180], [-330, -220], [-290, 200], [-270, -200],
            [-250, 220], [-230, -240], [-210, 200], [-190, -220],
            [-170, 180], [-150, -200], [470, 60], [490, 40],
            [510, -60], [530, -40], [770, 300], [780, 380],
            [760, 460], [740, 500], [720, 520], [700, 540]
        ];

        for (var ei = 0; ei < extraIslands.length; ei++) {
            var ex = extraIslands[ei][0];
            var ez = extraIslands[ei][1];
            var esize = 3 + (ei % 6) * 2;
            var edepth = 3 + (ei % 4) * 1.5;
            var emat = (ei % 3 === 0) ? darkIslandMat : ((ei % 3 === 1) ? lightIslandMat : islandMat);
            var egeo = new THREE.BoxGeometry(esize, 3, edepth);
            var eisland = makeMesh(egeo, emat);
            eisland.position.set(CX + ex, CY + 1.5, CZ + ez);
            addMesh(eisland);
        }

        // Wooded islands — trees as cylinders and cones on select islands
        var treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
        var treeFoliageMat = new THREE.MeshLambertMaterial({ color: 0x1A5C1A });

        var treeIslands = [
            [-320, -60], [-280, -120], [100, -110], [300, 80],
            [550, 280], [620, 420], [-400, -80]
        ];

        for (var ti = 0; ti < treeIslands.length; ti++) {
            var tx = treeIslands[ti][0];
            var tz = treeIslands[ti][1];

            var trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 5, 6);
            var trunk = makeMesh(trunkGeo, treeTrunkMat);
            trunk.position.set(CX + tx, CY + 4.5, CZ + tz);
            addMesh(trunk);

            var foliageGeo = new THREE.ConeGeometry(3, 6, 8);
            var foliage = makeMesh(foliageGeo, treeFoliageMat);
            foliage.position.set(CX + tx, CY + 10, CZ + tz);
            addMesh(foliage);

            if (ti % 2 === 0) {
                var trunk2Geo = new THREE.CylinderGeometry(0.35, 0.55, 4.5, 6);
                var trunk2 = makeMesh(trunk2Geo, treeTrunkMat);
                trunk2.position.set(CX + tx + 4, CY + 4.25, CZ + tz + 2);
                addMesh(trunk2);

                var foliage2Geo = new THREE.ConeGeometry(2.5, 5.5, 8);
                var foliage2 = makeMesh(foliage2Geo, treeFoliageMat);
                foliage2.position.set(CX + tx + 4, CY + 9.25, CZ + tz + 2);
                addMesh(foliage2);
            }
        }
    }

    function buildTerrain() {
        // Surrounding farmland / green terrain
        var farmMat = new THREE.MeshLambertMaterial({ color: 0x4A7C3F });
        var farm1Geo = new THREE.BoxGeometry(1800, 2, 1400);
        var farm1 = makeMesh(farm1Geo, farmMat);
        farm1.position.set(CX, CY - 2, CZ);
        addMesh(farm1);

        // Rolling drumlins — characteristic of Fermanagh landscape
        var drumlMat = new THREE.MeshLambertMaterial({ color: 0x5A8A50 });

        var drumlins = [
            [-800, -400, 60, 20, 40],
            [200, -350, 50, 15, 35],
            [800, 100, 70, 25, 50],
            [-100, 300, 45, 18, 30],
            [500, -200, 55, 20, 38],
            [-600, 350, 65, 22, 45],
            [900, 400, 48, 16, 32],
            [-900, 100, 58, 19, 42]
        ];

        for (var di = 0; di < drumlins.length; di++) {
            var dx = drumlins[di][0];
            var dz = drumlins[di][1];
            var dw = drumlins[di][2];
            var dh = drumlins[di][3];
            var dd = drumlins[di][4];
            var drumGeo = new THREE.BoxGeometry(dw, dh, dd);
            var drum = makeMesh(drumGeo, drumlMat);
            drum.position.set(CX + dx, CY + dh / 2, CZ + dz);
            addMesh(drum);
        }

        // Hedgerow field boundaries
        var hedgeMat = new THREE.MeshLambertMaterial({ color: 0x2D5A1B });

        var hedges = [
            [-300, 200, 200, 3, 1],
            [-300, 250, 1, 3, 50],
            [100, 200, 200, 3, 1],
            [100, 250, 1, 3, 50],
            [-300, 350, 200, 3, 1],
            [400, -300, 150, 3, 1],
            [400, -350, 1, 3, 50],
            [550, -300, 1, 3, 50]
        ];

        for (var hi = 0; hi < hedges.length; hi++) {
            var hx = hedges[hi][0];
            var hz = hedges[hi][1];
            var hw = hedges[hi][2];
            var hh = hedges[hi][3];
            var hd = hedges[hi][4];
            var hedgeGeo = new THREE.BoxGeometry(hw, hh, hd);
            var hedge = makeMesh(hedgeGeo, hedgeMat);
            hedge.position.set(CX + hx, CY + hh / 2 + 0.5, CZ + hz);
            addMesh(hedge);
        }

        // Enniskillen town suggestion — cluster of buildings
        var ennisMat = new THREE.MeshLambertMaterial({ color: 0xB0A090 });
        var ennis1Geo = new THREE.BoxGeometry(12, 8, 10);
        var ennis1 = makeMesh(ennis1Geo, ennisMat);
        ennis1.position.set(CX + 50, CY + 5, CZ + 30);
        addMesh(ennis1);

        var ennis2Geo = new THREE.BoxGeometry(10, 10, 9);
        var ennis2 = makeMesh(ennis2Geo, ennisMat);
        ennis2.position.set(CX + 65, CY + 6, CZ + 25);
        addMesh(ennis2);

        var ennis3Geo = new THREE.BoxGeometry(15, 7, 11);
        var ennis3 = makeMesh(ennis3Geo, ennisMat);
        ennis3.position.set(CX + 35, CY + 4.5, CZ + 40);
        addMesh(ennis3);

        // Enniskillen Castle remnant
        var castleMat = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });
        var castleGeo = new THREE.BoxGeometry(20, 14, 16);
        var castle = makeMesh(castleGeo, castleMat);
        castle.position.set(CX + 20, CY + 8, CZ + 20);
        addMesh(castle);

        var castleTower1Geo = new THREE.CylinderGeometry(3, 3.5, 18, 8);
        var castleTower1 = makeMesh(castleTower1Geo, castleMat);
        castleTower1.position.set(CX + 10, CY + 10, CZ + 12);
        addMesh(castleTower1);

        var castleTower2Geo = new THREE.CylinderGeometry(3, 3.5, 18, 8);
        var castleTower2 = makeMesh(castleTower2Geo, castleMat);
        castleTower2.position.set(CX + 30, CY + 10, CZ + 28);
        addMesh(castleTower2);
    }

    function build() {
        buildLakes();
        buildDevenishIsland();
        buildBoaIsland();
        buildMarbleArchCaves();
        buildCuilcaghMountain();
        buildBelleek();
        buildWhiteIsland();
        buildCruisers();
        buildScatteredIslands();
        buildTerrain();
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
