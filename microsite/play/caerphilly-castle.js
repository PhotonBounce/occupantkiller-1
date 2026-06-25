window.CaerphillyCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14480;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color) {
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
    }

    function buildWaterDefences() {
        // Outer moat/lake — north lake
        var northLakeGeo = new THREE.BoxGeometry(280, 2, 120);
        var northLake = makeMesh(northLakeGeo, 0x1a6b8a);
        northLake.position.set(X_OFFSET, 0, -180);
        addObj(northLake);

        // South lake
        var southLakeGeo = new THREE.BoxGeometry(280, 2, 120);
        var southLake = makeMesh(southLakeGeo, 0x1a6b8a);
        southLake.position.set(X_OFFSET, 0, 180);
        addObj(southLake);

        // West lake
        var westLakeGeo = new THREE.BoxGeometry(100, 2, 200);
        var westLake = makeMesh(westLakeGeo, 0x1a6b8a);
        westLake.position.set(X_OFFSET - 190, 0, 0);
        addObj(westLake);

        // East lake
        var eastLakeGeo = new THREE.BoxGeometry(100, 2, 200);
        var eastLake = makeMesh(eastLakeGeo, 0x1a6b8a);
        eastLake.position.set(X_OFFSET + 190, 0, 0);
        addObj(eastLake);

        // Inner moat channel — surrounds inner ward
        var innerMoatNGeo = new THREE.BoxGeometry(160, 1.5, 30);
        var innerMoatN = makeMesh(innerMoatNGeo, 0x1e7a9a);
        innerMoatN.position.set(X_OFFSET, 0.5, -80);
        addObj(innerMoatN);

        var innerMoatSGeo = new THREE.BoxGeometry(160, 1.5, 30);
        var innerMoatS = makeMesh(innerMoatSGeo, 0x1e7a9a);
        innerMoatS.position.set(X_OFFSET, 0.5, 80);
        addObj(innerMoatS);

        // South dam platform — massive earthwork/dam
        var southDamGeo = new THREE.BoxGeometry(260, 8, 40);
        var southDam = makeMesh(southDamGeo, 0x5a4a3a);
        southDam.position.set(X_OFFSET, 4, 240);
        addObj(southDam);

        // South dam sluice wall segments
        var sluiceWall1Geo = new THREE.BoxGeometry(10, 12, 8);
        var sluiceWall1 = makeMesh(sluiceWall1Geo, 0x706050);
        sluiceWall1.position.set(X_OFFSET - 30, 6, 240);
        addObj(sluiceWall1);

        var sluiceWall2Geo = new THREE.BoxGeometry(10, 12, 8);
        var sluiceWall2 = makeMesh(sluiceWall2Geo, 0x706050);
        sluiceWall2.position.set(X_OFFSET + 30, 6, 240);
        addObj(sluiceWall2);

        // North dam
        var northDamGeo = new THREE.BoxGeometry(260, 6, 30);
        var northDam = makeMesh(northDamGeo, 0x5a4a3a);
        northDam.position.set(X_OFFSET, 3, -240);
        addObj(northDam);

        // Lake bed / ground water colour fill
        var lakeFloorGeo = new THREE.BoxGeometry(340, 1, 340);
        var lakeFloor = makeMesh(lakeFloorGeo, 0x0d4f66);
        lakeFloor.position.set(X_OFFSET, -1, 0);
        addObj(lakeFloor);
    }

    function buildOuterWardWalls() {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });

        // Outer ward curtain walls — north
        var outerNGeo = new THREE.BoxGeometry(200, 12, 4);
        var outerN = makeMesh(outerNGeo, 0x8a7a6a);
        outerN.position.set(X_OFFSET, 6, -100);
        addObj(outerN);

        // Outer ward curtain walls — south
        var outerSGeo = new THREE.BoxGeometry(200, 12, 4);
        var outerS = makeMesh(outerSGeo, 0x8a7a6a);
        outerS.position.set(X_OFFSET, 6, 100);
        addObj(outerS);

        // Outer ward curtain walls — east
        var outerEGeo = new THREE.BoxGeometry(4, 12, 200);
        var outerE = makeMesh(outerEGeo, 0x8a7a6a);
        outerE.position.set(X_OFFSET + 100, 6, 0);
        addObj(outerE);

        // Outer ward curtain walls — west
        var outerWGeo = new THREE.BoxGeometry(4, 12, 200);
        var outerW = makeMesh(outerWGeo, 0x8a7a6a);
        outerW.position.set(X_OFFSET - 100, 6, 0);
        addObj(outerW);

        // Wall walk (crenellations top) — north
        var walkNGeo = new THREE.BoxGeometry(200, 2, 2);
        var walkN = makeMesh(walkNGeo, 0x7a6a5a);
        walkN.position.set(X_OFFSET, 13, -100);
        addObj(walkN);

        // Wall walk — south
        var walkSGeo = new THREE.BoxGeometry(200, 2, 2);
        var walkS = makeMesh(walkSGeo, 0x7a6a5a);
        walkS.position.set(X_OFFSET, 13, 100);
        addObj(walkS);

        // Arrow loops on outer north wall (small vertical slots)
        var loopPositions = [-60, -20, 20, 60];
        for (var i = 0; i < loopPositions.length; i++) {
            var loopGeo = new THREE.BoxGeometry(1.5, 4, 1);
            var loopMesh = makeMesh(loopGeo, 0x2a2018);
            loopMesh.position.set(X_OFFSET + loopPositions[i], 7, -102);
            addObj(loopMesh);
        }

        // Arrow loops on outer south wall
        for (var j = 0; j < loopPositions.length; j++) {
            var loopGeo2 = new THREE.BoxGeometry(1.5, 4, 1);
            var loopMesh2 = makeMesh(loopGeo2, 0x2a2018);
            loopMesh2.position.set(X_OFFSET + loopPositions[j], 7, 102);
            addObj(loopMesh2);
        }

        // Outer corner towers — round, four corners
        var cornerCyls = [
            [X_OFFSET - 100, -100],
            [X_OFFSET + 100, -100],
            [X_OFFSET - 100, 100],
            [X_OFFSET + 100, 100]
        ];
        for (var k = 0; k < cornerCyls.length; k++) {
            var ctGeo = new THREE.CylinderGeometry(10, 10, 16, 12);
            var ct = makeMesh(ctGeo, 0x7a6a5a);
            ct.position.set(cornerCyls[k][0], 8, cornerCyls[k][1]);
            addObj(ct);

            // Battlement cap on corner towers
            var ctCapGeo = new THREE.CylinderGeometry(10.5, 10, 2, 12);
            var ctCap = makeMesh(ctCapGeo, 0x6a5a4a);
            ctCap.position.set(cornerCyls[k][0], 17, cornerCyls[k][1]);
            addObj(ctCap);
        }

        // Midpoint towers — north and south walls
        var midTowers = [
            [X_OFFSET - 50, -100],
            [X_OFFSET + 50, -100],
            [X_OFFSET - 50, 100],
            [X_OFFSET + 50, 100]
        ];
        for (var m = 0; m < midTowers.length; m++) {
            var mtGeo = new THREE.CylinderGeometry(8, 8, 14, 10);
            var mt = makeMesh(mtGeo, 0x7a6a5a);
            mt.position.set(midTowers[m][0], 7, midTowers[m][1]);
            addObj(mt);
        }

        // East and west midpoint towers
        var ewMidTowers = [
            [X_OFFSET - 100, -50],
            [X_OFFSET - 100, 50],
            [X_OFFSET + 100, -50],
            [X_OFFSET + 100, 50]
        ];
        for (var n = 0; n < ewMidTowers.length; n++) {
            var emtGeo = new THREE.CylinderGeometry(8, 8, 14, 10);
            var emt = makeMesh(emtGeo, 0x7a6a5a);
            emt.position.set(ewMidTowers[n][0], 7, ewMidTowers[n][1]);
            addObj(emt);
        }

        // Outer ward ground
        var outerGroundGeo = new THREE.BoxGeometry(196, 1, 196);
        var outerGround = makeMesh(outerGroundGeo, 0x4a4030);
        outerGround.position.set(X_OFFSET, 0.5, 0);
        addObj(outerGround);
    }

    function buildInnerWard() {
        // Inner ward curtain walls — north
        var innNGeo = new THREE.BoxGeometry(100, 16, 5);
        var innN = makeMesh(innNGeo, 0x9a8a78);
        innN.position.set(X_OFFSET, 8, -50);
        addObj(innN);

        // Inner ward — south wall
        var innSGeo = new THREE.BoxGeometry(100, 16, 5);
        var innS = makeMesh(innSGeo, 0x9a8a78);
        innS.position.set(X_OFFSET, 8, 50);
        addObj(innS);

        // Inner ward — east wall
        var innEGeo = new THREE.BoxGeometry(5, 16, 100);
        var innE = makeMesh(innEGeo, 0x9a8a78);
        innE.position.set(X_OFFSET + 50, 8, 0);
        addObj(innE);

        // Inner ward — west wall
        var innWGeo = new THREE.BoxGeometry(5, 16, 100);
        var innW = makeMesh(innWGeo, 0x9a8a78);
        innW.position.set(X_OFFSET - 50, 8, 0);
        addObj(innW);

        // Inner ward corner towers — four corners
        var innCorners = [
            [X_OFFSET - 50, -50],
            [X_OFFSET + 50, -50],
            [X_OFFSET - 50, 50],
            [X_OFFSET + 50, 50]
        ];
        for (var i = 0; i < innCorners.length; i++) {
            var icGeo = new THREE.CylinderGeometry(9, 9, 22, 12);
            var ic = makeMesh(icGeo, 0x8a7a68);
            ic.position.set(innCorners[i][0], 11, innCorners[i][1]);
            addObj(ic);

            var icTopGeo = new THREE.CylinderGeometry(9.5, 9, 2.5, 12);
            var icTop = makeMesh(icTopGeo, 0x7a6a58);
            icTop.position.set(innCorners[i][0], 23.25, innCorners[i][1]);
            addObj(icTop);
        }

        // Great hall — ruined walls (inner ward)
        // North wall of great hall
        var ghNGeo = new THREE.BoxGeometry(60, 14, 3);
        var ghN = makeMesh(ghNGeo, 0xb09880);
        ghN.position.set(X_OFFSET + 5, 7, -30);
        addObj(ghN);

        // South wall of great hall — partially ruined, lower
        var ghSGeo = new THREE.BoxGeometry(60, 8, 3);
        var ghS = makeMesh(ghSGeo, 0xb09880);
        ghS.position.set(X_OFFSET + 5, 4, 30);
        addObj(ghS);

        // East wall of great hall
        var ghEGeo = new THREE.BoxGeometry(3, 14, 60);
        var ghE = makeMesh(ghEGeo, 0xb09880);
        ghE.position.set(X_OFFSET + 35, 7, 0);
        addObj(ghE);

        // West end of great hall — open (ruined, no west wall)
        // Floor of great hall
        var ghFloorGeo = new THREE.BoxGeometry(62, 0.5, 62);
        var ghFloor = makeMesh(ghFloorGeo, 0x5a4e3a);
        ghFloor.position.set(X_OFFSET + 5, 1, 0);
        addObj(ghFloor);

        // Inner ward floor
        var innFloorGeo = new THREE.BoxGeometry(94, 0.5, 94);
        var innFloor = makeMesh(innFloorGeo, 0x4a4238);
        innFloor.position.set(X_OFFSET, 1, 0);
        addObj(innFloor);

        // Inner ward wall walk (parapet)
        var innWalkNGeo = new THREE.BoxGeometry(100, 2, 2);
        var innWalkN = makeMesh(innWalkNGeo, 0x8a7a68);
        innWalkN.position.set(X_OFFSET, 17, -52);
        addObj(innWalkN);

        var innWalkSGeo = new THREE.BoxGeometry(100, 2, 2);
        var innWalkS = makeMesh(innWalkSGeo, 0x8a7a68);
        innWalkS.position.set(X_OFFSET, 17, 52);
        addObj(innWalkS);
    }

    function buildLeaningTower() {
        // Famous leaning tower — SE corner area, tilted off vertical
        var towerX = X_OFFSET + 50;
        var towerZ = -50;

        // Main shaft of leaning tower
        var leanGeo = new THREE.CylinderGeometry(8, 9, 30, 14);
        var leanTower = makeMesh(leanGeo, 0x9a8878);
        leanTower.position.set(towerX, 15, towerZ);
        // Lean ~10 degrees off vertical (rotate around Z axis)
        leanTower.rotation.z = 0.175;
        addObj(leanTower);

        // Battlement ring at top of leaning tower
        var leanCapGeo = new THREE.CylinderGeometry(8.5, 8, 3, 14);
        var leanCap = makeMesh(leanCapGeo, 0x8a7868);
        leanCap.position.set(towerX + 2.5, 31, towerZ);
        leanCap.rotation.z = 0.175;
        addObj(leanCap);

        // Battlement merlons around top of leaning tower
        var merCount = 8;
        for (var i = 0; i < merCount; i++) {
            var angle = (i / merCount) * Math.PI * 2;
            var merGeo = new THREE.BoxGeometry(3, 3, 3);
            var mer = makeMesh(merGeo, 0x887868);
            var mx = towerX + 2.5 + Math.cos(angle) * 8;
            var mz = towerZ + Math.sin(angle) * 8;
            mer.position.set(mx, 34, mz);
            addObj(mer);
        }

        // Base spur buttress of leaning tower
        var spurGeo = new THREE.BoxGeometry(6, 8, 6);
        var spur = makeMesh(spurGeo, 0x8a7a6a);
        spur.position.set(towerX - 4, 4, towerZ + 4);
        addObj(spur);
    }

    function buildGreatGatehouse() {
        // Great gatehouse — massive twin-towered east gatehouse
        var gateX = X_OFFSET + 50;
        var gateZ = 0;

        // Left (north) D-shaped gatehouse tower
        var gtn1Geo = new THREE.CylinderGeometry(12, 13, 28, 16);
        var gtn1 = makeMesh(gtn1Geo, 0x9a8878);
        gtn1.position.set(gateX, 14, gateZ - 18);
        addObj(gtn1);

        // Right (south) D-shaped gatehouse tower
        var gtn2Geo = new THREE.CylinderGeometry(12, 13, 28, 16);
        var gtn2 = makeMesh(gtn2Geo, 0x9a8878);
        gtn2.position.set(gateX, 14, gateZ + 18);
        addObj(gtn2);

        // Gate passage between towers (the arch / portcullis gap)
        var passageGeo = new THREE.BoxGeometry(10, 20, 16);
        var passage = makeMesh(passageGeo, 0xb09880);
        passage.position.set(gateX, 10, gateZ);
        addObj(passage);

        // Portcullis gap (dark slot)
        var portGeo = new THREE.BoxGeometry(7, 12, 18);
        var portcullis = makeMesh(portGeo, 0x1a1208);
        portcullis.position.set(gateX, 8, gateZ);
        addObj(portcullis);

        // Gatehouse battlements — top of left tower
        var batR1Geo = new THREE.CylinderGeometry(12.5, 12, 2.5, 16);
        var batR1 = makeMesh(batR1Geo, 0x887868);
        batR1.position.set(gateX, 29, gateZ - 18);
        addObj(batR1);

        // Gatehouse battlements — top of right tower
        var batR2Geo = new THREE.CylinderGeometry(12.5, 12, 2.5, 16);
        var batR2 = makeMesh(batR2Geo, 0x887868);
        batR2.position.set(gateX, 29, gateZ + 18);
        addObj(batR2);

        // Battlements on top — merlons left tower
        var merAngles = [0, 1, 2, 3, 4, 5, 6, 7];
        for (var i = 0; i < merAngles.length; i++) {
            var ang = (merAngles[i] / 8) * Math.PI * 2;
            var mGeo = new THREE.BoxGeometry(3, 3.5, 3);
            var m = makeMesh(mGeo, 0x807060);
            m.position.set(
                gateX + Math.cos(ang) * 12,
                32,
                gateZ - 18 + Math.sin(ang) * 12
            );
            addObj(m);
        }

        // Merlons right tower
        for (var j = 0; j < merAngles.length; j++) {
            var ang2 = (merAngles[j] / 8) * Math.PI * 2;
            var mGeo2 = new THREE.BoxGeometry(3, 3.5, 3);
            var m2 = makeMesh(mGeo2, 0x807060);
            m2.position.set(
                gateX + Math.cos(ang2) * 12,
                32,
                gateZ + 18 + Math.sin(ang2) * 12
            );
            addObj(m2);
        }

        // Storey floors in gatehouse (three storeys)
        var floorPositions = [8, 15, 22];
        for (var k = 0; k < floorPositions.length; k++) {
            var fGeo = new THREE.BoxGeometry(8, 1, 14);
            var fl = makeMesh(fGeo, 0x6a5a48);
            fl.position.set(gateX, floorPositions[k], gateZ);
            addObj(fl);
        }

        // West gatehouse (outer gate / barbican)
        var westGateX = X_OFFSET - 50;
        var wg1Geo = new THREE.CylinderGeometry(10, 11, 22, 14);
        var wg1 = makeMesh(wg1Geo, 0x9a8878);
        wg1.position.set(westGateX, 11, -14);
        addObj(wg1);

        var wg2Geo = new THREE.CylinderGeometry(10, 11, 22, 14);
        var wg2 = makeMesh(wg2Geo, 0x9a8878);
        wg2.position.set(westGateX, 11, 14);
        addObj(wg2);

        var wPassGeo = new THREE.BoxGeometry(8, 16, 14);
        var wPass = makeMesh(wPassGeo, 0xb09880);
        wPass.position.set(westGateX, 8, 0);
        addObj(wPass);

        var wPortGeo = new THREE.BoxGeometry(5, 10, 16);
        var wPort = makeMesh(wPortGeo, 0x1a1208);
        wPort.position.set(westGateX, 7, 0);
        addObj(wPort);
    }

    function buildTown() {
        // Caerphilly town — southeast of castle, hillside
        var townBaseX = X_OFFSET + 180;
        var townBaseZ = 80;

        // High Street — long road
        var roadGeo = new THREE.BoxGeometry(200, 0.5, 12);
        var road = makeMesh(roadGeo, 0x3a3028);
        road.position.set(townBaseX + 10, 0.3, townBaseZ + 20);
        addObj(road);

        // Market square
        var marketGeo = new THREE.BoxGeometry(40, 0.5, 40);
        var market = makeMesh(marketGeo, 0x4a4038);
        market.position.set(townBaseX, 0.3, townBaseZ);
        addObj(market);

        // Market hall building
        var mhGeo = new THREE.BoxGeometry(20, 8, 14);
        var mh = makeMesh(mhGeo, 0xc8a870);
        mh.position.set(townBaseX, 4, townBaseZ);
        addObj(mh);

        var mhRoofGeo = new THREE.BoxGeometry(22, 3, 16);
        var mhRoof = makeMesh(mhRoofGeo, 0x604030);
        mhRoof.position.set(townBaseX, 9.5, townBaseZ);
        addObj(mhRoof);

        // Welsh Miners Museum
        var museumGeo = new THREE.BoxGeometry(24, 10, 18);
        var museum = makeMesh(museumGeo, 0xa09070);
        museum.position.set(townBaseX + 60, 5, townBaseZ - 10);
        addObj(museum);

        var musRoofGeo = new THREE.BoxGeometry(26, 4, 20);
        var musRoof = makeMesh(musRoofGeo, 0x504028);
        musRoof.position.set(townBaseX + 60, 12, townBaseZ - 10);
        addObj(musRoof);

        // Museum sign post
        var signGeo = new THREE.BoxGeometry(1, 6, 0.5);
        var sign = makeMesh(signGeo, 0x5a4020);
        sign.position.set(townBaseX + 48, 3, townBaseZ - 10);
        addObj(sign);

        // Terraced houses on hillside — row 1
        var houseColors = [0xc8b090, 0xb8a080, 0xd0b898, 0xb09878, 0xc0a888];
        var row1Z = townBaseZ + 60;
        for (var i = 0; i < 8; i++) {
            var hGeo = new THREE.BoxGeometry(10, 9, 10);
            var h = makeMesh(hGeo, houseColors[i % houseColors.length]);
            h.position.set(townBaseX - 40 + i * 12, 4.5 + i * 0.5, row1Z);
            addObj(h);

            var hrGeo = new THREE.BoxGeometry(11, 3, 11);
            var hr = makeMesh(hrGeo, 0x602020);
            hr.position.set(townBaseX - 40 + i * 12, 10.5 + i * 0.5, row1Z);
            addObj(hr);
        }

        // Terraced houses — row 2, higher up hill
        var row2Z = townBaseZ + 90;
        for (var j = 0; j < 6; j++) {
            var h2Geo = new THREE.BoxGeometry(10, 9, 10);
            var h2 = makeMesh(h2Geo, houseColors[(j + 2) % houseColors.length]);
            h2.position.set(townBaseX - 30 + j * 12, 6 + j * 0.6, row2Z);
            addObj(h2);

            var hr2Geo = new THREE.BoxGeometry(11, 3, 11);
            var hr2 = makeMesh(hr2Geo, 0x701818);
            hr2.position.set(townBaseX - 30 + j * 12, 12 + j * 0.6, row2Z);
            addObj(hr2);
        }

        // Church / chapel
        var churchGeo = new THREE.BoxGeometry(16, 14, 22);
        var church = makeMesh(churchGeo, 0xd0c0a8);
        church.position.set(townBaseX - 60, 7, townBaseZ + 40);
        addObj(church);

        var churchTowerGeo = new THREE.BoxGeometry(7, 22, 7);
        var churchTower = makeMesh(churchTowerGeo, 0xc0b098);
        churchTower.position.set(townBaseX - 52, 11, townBaseZ + 29);
        addObj(churchTower);

        var churchSpireGeo = new THREE.ConeGeometry(4, 10, 8);
        var churchSpire = makeMesh(churchSpireGeo, 0x705040);
        churchSpire.position.set(townBaseX - 52, 27, townBaseZ + 29);
        addObj(churchSpire);

        // Pub / inn on high street
        var pubGeo = new THREE.BoxGeometry(14, 10, 12);
        var pub = makeMesh(pubGeo, 0xe0c090);
        pub.position.set(townBaseX + 110, 5, townBaseZ + 20);
        addObj(pub);

        var pubRoofGeo = new THREE.BoxGeometry(15, 3, 13);
        var pubRoof = makeMesh(pubRoofGeo, 0x503020);
        pubRoof.position.set(townBaseX + 110, 11.5, townBaseZ + 20);
        addObj(pubRoof);

        // Town ground / hillside terrain
        var townGroundGeo = new THREE.BoxGeometry(320, 1, 180);
        var townGround = makeMesh(townGroundGeo, 0x3a4828);
        townGround.position.set(townBaseX + 10, 0, townBaseZ + 50);
        addObj(townGround);

        // Hillside slope blocks
        for (var k = 0; k < 5; k++) {
            var slopeGeo = new THREE.BoxGeometry(320, 2 + k * 1.5, 20);
            var slope = makeMesh(slopeGeo, 0x384228);
            slope.position.set(townBaseX + 10, k * 1.5, townBaseZ + 70 + k * 20);
            addObj(slope);
        }
    }

    function buildGroundPlane() {
        // Castle island ground
        var islandGeo = new THREE.BoxGeometry(240, 1, 240);
        var island = makeMesh(islandGeo, 0x3d3828);
        island.position.set(X_OFFSET, 0, 0);
        addObj(island);

        // Extended surrounding terrain
        var terrainGeo = new THREE.BoxGeometry(800, 1, 800);
        var terrain = makeMesh(terrainGeo, 0x2e3820);
        terrain.position.set(X_OFFSET + 100, -0.5, 0);
        addObj(terrain);
    }

    function buildCastleLighting() {
        // Flag poles on towers
        var flagPolePositions = [
            [X_OFFSET - 50, -50],
            [X_OFFSET + 50, -50]
        ];
        for (var i = 0; i < flagPolePositions.length; i++) {
            var poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 10, 6);
            var pole = makeMesh(poleGeo, 0xaaaaaa);
            pole.position.set(flagPolePositions[i][0], 30, flagPolePositions[i][1]);
            addObj(pole);

            var flagGeo = new THREE.BoxGeometry(5, 3, 0.2);
            var flag = makeMesh(flagGeo, 0xdd2020);
            flag.position.set(flagPolePositions[i][0] + 2.5, 36, flagPolePositions[i][1]);
            addObj(flag);
        }
    }

    function build() {
        buildGroundPlane();
        buildWaterDefences();
        buildOuterWardWalls();
        buildInnerWard();
        buildLeaningTower();
        buildGreatGatehouse();
        buildTown();
        buildCastleLighting();
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
