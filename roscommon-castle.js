window.RoscommonCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 18080;
    var CY = 0;
    var CZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        return mesh;
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function placeMesh(mesh, x, y, z) {
        mesh.position.set(CX + x, CY + y, CZ + z);
        return mesh;
    }

    function build() {
        buildGround();
        buildCastleWalls();
        buildCornerTowers();
        buildGatehouse();
        buildCourtyard();
        buildMoat();
        buildCastleRubble();
        buildDominicanPriory();
        buildTownhouses();
        buildMarketSquare();
        buildLoughRee();
        buildFloodplain();
        buildTuamRoad();
        buildRoadTrees();
        buildSkybox();
    }

    function buildGround() {
        // Main ground slab using stacked boxes
        var groundGeo = new THREE.BoxGeometry(600, 1, 600);
        var ground = makeMesh(groundGeo, 0x3CB371);
        placeMesh(ground, 0, -0.5, 0);
        addMesh(ground);

        // Immediate surrounds of castle — earthen ground
        var castleGroundGeo = new THREE.BoxGeometry(130, 0.5, 130);
        var castleGround = makeMesh(castleGroundGeo, 0x6B4F2A);
        placeMesh(castleGround, 0, 0, 0);
        addMesh(castleGround);
    }

    function buildCastleWalls() {
        var wallColor = 0x8B7355;
        var wallH = 9;
        var wallThick = 2;
        var halfW = 48;
        var halfD = 40;

        // North wall (continuous with gap for gatehouse in south)
        var northWallGeo = new THREE.BoxGeometry(96, wallH, wallThick);
        var northWall = makeMesh(northWallGeo, wallColor);
        placeMesh(northWall, 0, wallH / 2, -halfD);
        addMesh(northWall);

        // South wall — two segments flanking gatehouse entrance
        var southWallLeftGeo = new THREE.BoxGeometry(34, wallH, wallThick);
        var southWallLeft = makeMesh(southWallLeftGeo, wallColor);
        placeMesh(southWallLeft, -31, wallH / 2, halfD);
        addMesh(southWallLeft);

        var southWallRightGeo = new THREE.BoxGeometry(34, wallH, wallThick);
        var southWallRight = makeMesh(southWallRightGeo, wallColor);
        placeMesh(southWallRight, 31, wallH / 2, halfD);
        addMesh(southWallRight);

        // West wall
        var westWallGeo = new THREE.BoxGeometry(wallThick, wallH, 80);
        var westWall = makeMesh(westWallGeo, wallColor);
        placeMesh(westWall, -halfW, wallH / 2, 0);
        addMesh(westWall);

        // East wall
        var eastWallGeo = new THREE.BoxGeometry(wallThick, wallH, 80);
        var eastWall = makeMesh(eastWallGeo, wallColor);
        placeMesh(eastWall, halfW, wallH / 2, 0);
        addMesh(eastWall);

        // Wall crenellations — north wall merlons
        for (var i = -4; i <= 4; i++) {
            var merlonGeo = new THREE.BoxGeometry(5, 2, wallThick);
            var merlon = makeMesh(merlonGeo, wallColor);
            placeMesh(merlon, i * 10, wallH + 1, -halfD);
            addMesh(merlon);
        }

        // Wall crenellations — west wall merlons
        for (var j = -3; j <= 3; j++) {
            var merlonWGeo = new THREE.BoxGeometry(wallThick, 2, 5);
            var merlonW = makeMesh(merlonWGeo, wallColor);
            placeMesh(merlonW, -halfW, wallH + 1, j * 11);
            addMesh(merlonW);
        }

        // Wall crenellations — east wall merlons
        for (var k = -3; k <= 3; k++) {
            var merlonEGeo = new THREE.BoxGeometry(wallThick, 2, 5);
            var merlonE = makeMesh(merlonEGeo, wallColor);
            placeMesh(merlonE, halfW, wallH + 1, k * 11);
            addMesh(merlonE);
        }

        // Partially collapsed section — north wall rubble
        var collapseGeo = new THREE.BoxGeometry(12, 4, wallThick + 1);
        var collapse = makeMesh(collapseGeo, wallColor);
        placeMesh(collapse, 20, 2, -halfD);
        addMesh(collapse);

        // Ruined wall stump — east side low section
        var stumpGeo = new THREE.BoxGeometry(wallThick, 4, 20);
        var stump = makeMesh(stumpGeo, wallColor);
        placeMesh(stump, halfW, 2, -15);
        addMesh(stump);
    }

    function buildCornerTowers() {
        var towerColor = 0x8B7355;
        var towerRadius = 4;
        var towerH = 12;
        var halfW = 48;
        var halfD = 40;

        // NW tower
        var nwGeo = new THREE.CylinderGeometry(towerRadius, towerRadius + 0.5, towerH, 10);
        var nwTower = makeMesh(nwGeo, towerColor);
        placeMesh(nwTower, -halfW, towerH / 2, -halfD);
        addMesh(nwTower);

        // NE tower
        var neGeo = new THREE.CylinderGeometry(towerRadius, towerRadius + 0.5, towerH, 10);
        var neTower = makeMesh(neGeo, towerColor);
        placeMesh(neTower, halfW, towerH / 2, -halfD);
        addMesh(neTower);

        // SW tower
        var swGeo = new THREE.CylinderGeometry(towerRadius, towerRadius + 0.5, towerH, 10);
        var swTower = makeMesh(swGeo, towerColor);
        placeMesh(swTower, -halfW, towerH / 2, halfD);
        addMesh(swTower);

        // SE tower
        var seGeo = new THREE.CylinderGeometry(towerRadius, towerRadius + 0.5, towerH, 10);
        var seTower = makeMesh(seGeo, towerColor);
        placeMesh(seTower, halfW, towerH / 2, halfD);
        addMesh(seTower);

        // Tower cap rings
        var capColor = 0x7A6045;
        var nwCapGeo = new THREE.CylinderGeometry(towerRadius + 0.3, towerRadius + 0.3, 0.8, 10);
        var nwCap = makeMesh(nwCapGeo, capColor);
        placeMesh(nwCap, -halfW, towerH + 0.4, -halfD);
        addMesh(nwCap);

        var neCapGeo = new THREE.CylinderGeometry(towerRadius + 0.3, towerRadius + 0.3, 0.8, 10);
        var neCap = makeMesh(neCapGeo, capColor);
        placeMesh(neCap, halfW, towerH + 0.4, -halfD);
        addMesh(neCap);

        var swCapGeo = new THREE.CylinderGeometry(towerRadius + 0.3, towerRadius + 0.3, 0.8, 10);
        var swCap = makeMesh(swCapGeo, capColor);
        placeMesh(swCap, -halfW, towerH + 0.4, halfD);
        addMesh(swCap);

        var seCapGeo = new THREE.CylinderGeometry(towerRadius + 0.3, towerRadius + 0.3, 0.8, 10);
        var seCap = makeMesh(seCapGeo, capColor);
        placeMesh(seCap, halfW, towerH + 0.4, halfD);
        addMesh(seCap);
    }

    function buildGatehouse() {
        var gateColor = 0x8B7355;
        var halfD = 40;

        // Left gatehouse tower
        var leftTowerGeo = new THREE.CylinderGeometry(5, 5.5, 13, 10);
        var leftTower = makeMesh(leftTowerGeo, gateColor);
        placeMesh(leftTower, -12, 6.5, halfD);
        addMesh(leftTower);

        // Right gatehouse tower
        var rightTowerGeo = new THREE.CylinderGeometry(5, 5.5, 13, 10);
        var rightTower = makeMesh(rightTowerGeo, gateColor);
        placeMesh(rightTower, 12, 6.5, halfD);
        addMesh(rightTower);

        // Gatehouse arch lintel (top of entrance passage)
        var lintelGeo = new THREE.BoxGeometry(14, 2, 4);
        var lintel = makeMesh(lintelGeo, gateColor);
        placeMesh(lintel, 0, 8, halfD);
        addMesh(lintel);

        // Gatehouse passage floor
        var passageGeo = new THREE.BoxGeometry(10, 0.3, 8);
        var passage = makeMesh(passageGeo, 0x6B4F2A);
        placeMesh(passage, 0, 0.15, halfD);
        addMesh(passage);

        // Gatehouse parapet connecting towers
        var parapetGeo = new THREE.BoxGeometry(24, 2, 2);
        var parapet = makeMesh(parapetGeo, gateColor);
        placeMesh(parapet, 0, 12, halfD);
        addMesh(parapet);

        // Left tower cap
        var ltCapGeo = new THREE.ConeGeometry(5.2, 3, 10);
        var ltCap = makeMesh(ltCapGeo, 0x7A6045);
        placeMesh(ltCap, -12, 14.5, halfD);
        addMesh(ltCap);

        // Right tower cap
        var rtCapGeo = new THREE.ConeGeometry(5.2, 3, 10);
        var rtCap = makeMesh(rtCapGeo, 0x7A6045);
        placeMesh(rtCap, 12, 14.5, halfD);
        addMesh(rtCap);
    }

    function buildCourtyard() {
        // Interior grass courtyard
        var grassGeo = new THREE.BoxGeometry(90, 0.3, 74);
        var grass = makeMesh(grassGeo, 0x228B22);
        placeMesh(grass, 0, 0.15, 0);
        addMesh(grass);

        // Well in courtyard center
        var wellBaseGeo = new THREE.CylinderGeometry(2, 2, 1, 10);
        var wellBase = makeMesh(wellBaseGeo, 0x8B7355);
        placeMesh(wellBase, -5, 0.5, -5);
        addMesh(wellBase);

        var wellRimGeo = new THREE.CylinderGeometry(2.2, 2, 0.4, 10);
        var wellRim = makeMesh(wellRimGeo, 0x7A6045);
        placeMesh(wellRim, -5, 1.2, -5);
        addMesh(wellRim);

        // Interior wall remnants / buttresses
        var buttress1Geo = new THREE.BoxGeometry(2, 5, 4);
        var buttress1 = makeMesh(buttress1Geo, 0x8B7355);
        placeMesh(buttress1, -46, 2.5, -15);
        addMesh(buttress1);

        var buttress2Geo = new THREE.BoxGeometry(2, 5, 4);
        var buttress2 = makeMesh(buttress2Geo, 0x8B7355);
        placeMesh(buttress2, 46, 2.5, 10);
        addMesh(buttress2);

        // Fallen stone blocks in courtyard
        var block1Geo = new THREE.BoxGeometry(3, 1, 1.5);
        var block1 = makeMesh(block1Geo, 0x9A8465);
        placeMesh(block1, 10, 0.5, 8);
        block1.rotation.y = 0.4;
        addMesh(block1);

        var block2Geo = new THREE.BoxGeometry(2, 0.8, 1);
        var block2 = makeMesh(block2Geo, 0x9A8465);
        placeMesh(block2, -15, 0.4, 12);
        block2.rotation.y = -0.6;
        addMesh(block2);

        var block3Geo = new THREE.BoxGeometry(4, 1.2, 2);
        var block3 = makeMesh(block3Geo, 0x8B7355);
        placeMesh(block3, 20, 0.6, -10);
        block3.rotation.y = 1.1;
        addMesh(block3);
    }

    function buildMoat() {
        var moatColor = 0x556B2F;
        // North moat
        var northMoatGeo = new THREE.BoxGeometry(110, 0.6, 14);
        var northMoat = makeMesh(northMoatGeo, moatColor);
        placeMesh(northMoat, 0, -0.3, -54);
        addMesh(northMoat);

        // South moat
        var southMoatGeo = new THREE.BoxGeometry(110, 0.6, 14);
        var southMoat = makeMesh(southMoatGeo, moatColor);
        placeMesh(southMoat, 0, -0.3, 54);
        addMesh(southMoat);

        // West moat
        var westMoatGeo = new THREE.BoxGeometry(14, 0.6, 80);
        var westMoat = makeMesh(westMoatGeo, moatColor);
        placeMesh(westMoat, -62, -0.3, 0);
        addMesh(westMoat);

        // East moat
        var eastMoatGeo = new THREE.BoxGeometry(14, 0.6, 80);
        var eastMoat = makeMesh(eastMoatGeo, moatColor);
        placeMesh(eastMoat, 62, -0.3, 0);
        addMesh(eastMoat);

        // Moat water remnants (slightly lower, darker)
        var moatWaterGeo = new THREE.BoxGeometry(100, 0.2, 6);
        var moatWater = makeMesh(moatWaterGeo, 0x4A7A4A);
        placeMesh(moatWater, 0, -0.1, -54);
        addMesh(moatWater);
    }

    function buildCastleRubble() {
        // Scattered rubble around castle exterior
        var rubblePositions = [
            [-55, 0, -35, 3, 0.7, 2],
            [55, 0, 20, 2, 0.5, 1.5],
            [-30, 0, -48, 4, 0.8, 2.5],
            [25, 0, -48, 2.5, 0.6, 2],
            [-50, 0, 30, 3, 0.9, 2],
            [40, 0, 48, 2, 0.5, 1.5],
            [-20, 0, 48, 3.5, 0.7, 2]
        ];
        for (var r = 0; r < rubblePositions.length; r++) {
            var rp = rubblePositions[r];
            var rubGeo = new THREE.BoxGeometry(rp[3], rp[4], rp[5]);
            var rub = makeMesh(rubGeo, 0x9A8465);
            placeMesh(rub, rp[0], rp[4] / 2, rp[2]);
            rub.rotation.y = r * 0.7;
            addMesh(rub);
        }
    }

    function buildDominicanPriory() {
        var prioryColor = 0x808080;
        var prioryOffX = -120;
        var prioryOffZ = -80;

        // Main priory nave walls
        var naveNGeo = new THREE.BoxGeometry(40, 6, 1.5);
        var naveN = makeMesh(naveNGeo, prioryColor);
        placeMesh(naveN, prioryOffX, 3, prioryOffZ - 10);
        addMesh(naveN);

        var naveSGeo = new THREE.BoxGeometry(40, 6, 1.5);
        var naveS = makeMesh(naveSGeo, prioryColor);
        placeMesh(naveS, prioryOffX, 3, prioryOffZ + 10);
        addMesh(naveS);

        var naveEGeo = new THREE.BoxGeometry(1.5, 6, 20);
        var naveE = makeMesh(naveEGeo, prioryColor);
        placeMesh(naveE, prioryOffX + 20, 3, prioryOffZ);
        addMesh(naveE);

        // Chancel extension
        var chancelGeo = new THREE.BoxGeometry(16, 5, 8);
        var chancel = makeMesh(chancelGeo, prioryColor);
        placeMesh(chancel, prioryOffX - 28, 2.5, prioryOffZ);
        addMesh(chancel);

        // Priory tower stump
        var prioryTowerGeo = new THREE.BoxGeometry(6, 10, 6);
        var prioryTower = makeMesh(prioryTowerGeo, prioryColor);
        placeMesh(prioryTower, prioryOffX + 18, 5, prioryOffZ - 8);
        addMesh(prioryTower);

        // Tomb effigy — carved box slab
        var tombSlabGeo = new THREE.BoxGeometry(7, 0.4, 3);
        var tombSlab = makeMesh(tombSlabGeo, 0x909090);
        placeMesh(tombSlab, prioryOffX - 5, 0.2, prioryOffZ);
        addMesh(tombSlab);

        // Tomb effigy figure (box representation)
        var effigyGeo = new THREE.BoxGeometry(1.8, 0.5, 2.8);
        var effigy = makeMesh(effigyGeo, 0xA0A0A0);
        placeMesh(effigy, prioryOffX - 5, 0.65, prioryOffZ);
        addMesh(effigy);

        // Graveyard boundary wall
        var gYardWallNGeo = new THREE.BoxGeometry(60, 1.5, 0.8);
        var gYardWallN = makeMesh(gYardWallNGeo, 0x707070);
        placeMesh(gYardWallN, prioryOffX, 0.75, prioryOffZ - 18);
        addMesh(gYardWallN);

        var gYardWallSGeo = new THREE.BoxGeometry(60, 1.5, 0.8);
        var gYardWallS = makeMesh(gYardWallSGeo, 0x707070);
        placeMesh(gYardWallS, prioryOffX, 0.75, prioryOffZ + 22);
        addMesh(gYardWallS);

        // Headstones
        var headstoneOffsets = [
            [5, prioryOffZ + 14],
            [-5, prioryOffZ + 14],
            [12, prioryOffZ + 14],
            [-12, prioryOffZ + 14],
            [20, prioryOffZ + 16]
        ];
        for (var h = 0; h < headstoneOffsets.length; h++) {
            var hso = headstoneOffsets[h];
            var hsGeo = new THREE.BoxGeometry(0.5, 1.2, 0.2);
            var hs = makeMesh(hsGeo, 0x888888);
            placeMesh(hs, prioryOffX + hso[0], 0.6, hso[1]);
            addMesh(hs);
        }
    }

    function buildTownhouses() {
        var townOffX = 60;
        var townOffZ = -120;
        var houseColor = 0xCD5C5C;
        var roofColor = 0x8B2020;

        var houseData = [
            [0, 0, 8, 7, 6],
            [12, 0, 7, 8, 6],
            [24, 4, 9, 7, 7],
            [36, 0, 8, 8, 6],
            [48, 2, 7, 7, 6],
            [-12, 0, 8, 7, 6],
            [-24, 0, 9, 8, 7],
            [-36, 0, 7, 7, 5]
        ];

        for (var t = 0; t < houseData.length; t++) {
            var hd = houseData[t];
            var houseGeo = new THREE.BoxGeometry(hd[2], hd[3], hd[4]);
            var house = makeMesh(houseGeo, houseColor);
            placeMesh(house, townOffX + hd[0], hd[3] / 2, townOffZ + hd[1]);
            addMesh(house);

            // Roof (box wedge approximation)
            var roofGeo = new THREE.BoxGeometry(hd[2] + 0.5, 2, hd[4] + 0.5);
            var roof = makeMesh(roofGeo, roofColor);
            placeMesh(roof, townOffX + hd[0], hd[3] + 1, townOffZ + hd[1]);
            addMesh(roof);

            // Chimney
            var chimneyGeo = new THREE.BoxGeometry(0.8, 2.5, 0.8);
            var chimney = makeMesh(chimneyGeo, 0x8B4513);
            placeMesh(chimney, townOffX + hd[0] + 2, hd[3] + 2.75, townOffZ + hd[1]);
            addMesh(chimney);
        }
    }

    function buildMarketSquare() {
        var sqOffX = 60;
        var sqOffZ = -80;

        // Market square paving
        var squareGeo = new THREE.BoxGeometry(40, 0.2, 30);
        var square = makeMesh(squareGeo, 0x999999);
        placeMesh(square, sqOffX, 0.1, sqOffZ);
        addMesh(square);

        // Market cross monument
        var crossBaseGeo = new THREE.BoxGeometry(3, 0.8, 3);
        var crossBase = makeMesh(crossBaseGeo, 0x888888);
        placeMesh(crossBase, sqOffX, 0.4, sqOffZ);
        addMesh(crossBase);

        var crossPillarGeo = new THREE.BoxGeometry(0.6, 4, 0.6);
        var crossPillar = makeMesh(crossPillarGeo, 0x999999);
        placeMesh(crossPillar, sqOffX, 2.8, sqOffZ);
        addMesh(crossPillar);

        var crossArmGeo = new THREE.BoxGeometry(2.5, 0.5, 0.5);
        var crossArm = makeMesh(crossArmGeo, 0x999999);
        placeMesh(crossArm, sqOffX, 4.5, sqOffZ);
        addMesh(crossArm);

        // Pub / shop fronts along square edge
        var pubGeo = new THREE.BoxGeometry(12, 6, 5);
        var pub = makeMesh(pubGeo, 0xB0522A);
        placeMesh(pub, sqOffX + 26, 3, sqOffZ);
        addMesh(pub);

        var pubRoofGeo = new THREE.BoxGeometry(12.5, 1.5, 5.5);
        var pubRoof = makeMesh(pubRoofGeo, 0x7A3215);
        placeMesh(pubRoof, sqOffX + 26, 6.75, sqOffZ);
        addMesh(pubRoof);
    }

    function buildLoughRee() {
        // Lough Ree — large blue lake body to the east
        var lakeGeo = new THREE.BoxGeometry(200, 0.3, 280);
        var lake = makeMesh(lakeGeo, 0x006994);
        placeMesh(lake, 250, -0.15, -50);
        addMesh(lake);

        // Lake shore edge (lighter strip)
        var shoreGeo = new THREE.BoxGeometry(15, 0.2, 280);
        var shore = makeMesh(shoreGeo, 0x4A9AB0);
        placeMesh(shore, 148, 0.1, -50);
        addMesh(shore);

        // Small island in lake
        var islandGeo = new THREE.BoxGeometry(20, 0.5, 15);
        var island = makeMesh(islandGeo, 0x228B22);
        placeMesh(island, 270, 0.25, 30);
        addMesh(island);

        // Island trees (cylinders)
        var isTree1Geo = new THREE.CylinderGeometry(2, 2, 6, 6);
        var isTree1 = makeMesh(isTree1Geo, 0x1A6B1A);
        placeMesh(isTree1, 268, 3.3, 28);
        addMesh(isTree1);

        var isTree2Geo = new THREE.CylinderGeometry(1.5, 1.5, 5, 6);
        var isTree2 = makeMesh(isTree2Geo, 0x1A6B1A);
        placeMesh(isTree2, 274, 2.75, 33);
        addMesh(isTree2);
    }

    function buildFloodplain() {
        // Shannon River floodplain — flat green midlands
        var plainGeo = new THREE.BoxGeometry(300, 0.2, 150);
        var plain = makeMesh(plainGeo, 0x3CB371);
        placeMesh(plain, 0, 0.1, 160);
        addMesh(plain);

        // Shannon River channel
        var riverGeo = new THREE.BoxGeometry(20, 0.3, 300);
        var river = makeMesh(riverGeo, 0x1A6B99);
        placeMesh(river, 190, 0.15, 80);
        addMesh(river);

        // River bank strips
        var bankGeo = new THREE.BoxGeometry(8, 0.2, 300);
        var bank = makeMesh(bankGeo, 0x4A7A2A);
        placeMesh(bank, 178, 0.1, 80);
        addMesh(bank);

        // Hedgerows dividing fields
        var hedge1Geo = new THREE.BoxGeometry(60, 1.5, 1.2);
        var hedge1 = makeMesh(hedge1Geo, 0x1A5A1A);
        placeMesh(hedge1, -40, 0.75, 130);
        addMesh(hedge1);

        var hedge2Geo = new THREE.BoxGeometry(1.2, 1.5, 50);
        var hedge2 = makeMesh(hedge2Geo, 0x1A5A1A);
        placeMesh(hedge2, -70, 0.75, 155);
        addMesh(hedge2);

        var hedge3Geo = new THREE.BoxGeometry(50, 1.5, 1.2);
        var hedge3 = makeMesh(hedge3Geo, 0x1A5A1A);
        placeMesh(hedge3, 20, 0.75, 180);
        addMesh(hedge3);
    }

    function buildTuamRoad() {
        var roadColor = 0x555555;
        // Main road approaching from south
        var road1Geo = new THREE.BoxGeometry(8, 0.15, 120);
        var road1 = makeMesh(road1Geo, roadColor);
        placeMesh(road1, 0, 0.075, 115);
        addMesh(road1);

        // Road through town
        var road2Geo = new THREE.BoxGeometry(8, 0.15, 80);
        var road2 = makeMesh(road2Geo, roadColor);
        placeMesh(road2, 0, 0.075, -110);
        addMesh(road2);

        // Road markings — dashes
        for (var m = 0; m < 5; m++) {
            var dashGeo = new THREE.BoxGeometry(0.3, 0.05, 5);
            var dash = makeMesh(dashGeo, 0xFFFFFF);
            placeMesh(dash, 0, 0.18, 80 + m * 12);
            addMesh(dash);
        }

        // Side lane branching east toward castle
        var laneGeo = new THREE.BoxGeometry(60, 0.15, 5);
        var lane = makeMesh(laneGeo, roadColor);
        placeMesh(lane, -60, 0.075, 70);
        addMesh(lane);
    }

    function buildRoadTrees() {
        var trunkColor = 0x5C3A1A;
        var canopyColor = 0x228B22;

        // Trees lining the road on both sides
        var treePositions = [
            [8, 80], [-8, 80],
            [8, 100], [-8, 100],
            [8, 120], [-8, 120],
            [8, 140], [-8, 140],
            [8, -95], [-8, -95],
            [8, -115], [-8, -115]
        ];

        for (var tp = 0; tp < treePositions.length; tp++) {
            var tpos = treePositions[tp];
            var trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 6);
            var trunk = makeMesh(trunkGeo, trunkColor);
            placeMesh(trunk, tpos[0], 2, tpos[1]);
            addMesh(trunk);

            var canopyGeo = new THREE.SphereGeometry(2.5, 6, 5);
            var canopy = makeMesh(canopyGeo, canopyColor);
            placeMesh(canopy, tpos[0], 5.5, tpos[1]);
            addMesh(canopy);
        }

        // Extra stand of trees west of castle
        var forestPositions = [
            [-90, -30], [-100, -20], [-95, -40],
            [-105, -10], [-88, -50], [-112, -35]
        ];
        for (var fp = 0; fp < forestPositions.length; fp++) {
            var fpos = forestPositions[fp];
            var ftGeo = new THREE.CylinderGeometry(0.35, 0.5, 5, 6);
            var ft = makeMesh(ftGeo, trunkColor);
            placeMesh(ft, fpos[0], 2.5, fpos[1]);
            addMesh(ft);

            var fcGeo = new THREE.SphereGeometry(3, 6, 5);
            var fc = makeMesh(fcGeo, 0x1A6B1A);
            placeMesh(fc, fpos[0], 6.5, fpos[1]);
            addMesh(fc);
        }
    }

    function buildSkybox() {
        // Distant hill silhouettes in background (flat box ranges)
        var hill1Geo = new THREE.BoxGeometry(200, 18, 20);
        var hill1 = makeMesh(hill1Geo, 0x5A7A4A);
        placeMesh(hill1, -200, 9, -280);
        addMesh(hill1);

        var hill2Geo = new THREE.BoxGeometry(150, 14, 20);
        var hill2 = makeMesh(hill2Geo, 0x5A7A4A);
        placeMesh(hill2, 80, 7, -290);
        addMesh(hill2);

        // Ambient lighting sphere (sky dome approximation)
        var skyGeo = new THREE.SphereGeometry(500, 8, 6);
        var sky = makeMesh(skyGeo, 0x87CEEB);
        placeMesh(sky, 0, 0, 0);
        sky.material.side = THREE.BackSide;
        addMesh(sky);
    }

    function update(delta) {
        // Static environment — no per-frame updates required
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
