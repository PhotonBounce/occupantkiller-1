window.RannochMoor = (function() {
    'use strict';

    var WORLD_X = 1810;
    var WORLD_Z = 2200;

    function createBaBridge(scene) {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x7A7A6A });
        var archMat = new THREE.MeshLambertMaterial({ color: 0x6A6A5A });

        var bridgeDeck = new THREE.Mesh(
            new THREE.BoxGeometry(8, 4, 4),
            stoneMat
        );
        bridgeDeck.position.set(WORLD_X + 30, 2, WORLD_Z - 40);
        scene.add(bridgeDeck);

        var pillar1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 1.0, 5, 8),
            archMat
        );
        pillar1.position.set(WORLD_X + 26, 0, WORLD_Z - 40);
        scene.add(pillar1);

        var pillar2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 1.0, 5, 8),
            archMat
        );
        pillar2.position.set(WORLD_X + 34, 0, WORLD_Z - 40);
        scene.add(pillar2);

        var railing1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 0.6, 0.3),
            stoneMat
        );
        railing1.position.set(WORLD_X + 30, 4.3, WORLD_Z - 38.2);
        scene.add(railing1);

        var railing2 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 0.6, 0.3),
            stoneMat
        );
        railing2.position.set(WORLD_X + 30, 4.3, WORLD_Z - 41.8);
        scene.add(railing2);
    }

    function createRannochStation(scene) {
        var stationMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x5A3A2A });
        var platformMat = new THREE.MeshLambertMaterial({ color: 0xB0A090 });
        var windowMat = new THREE.MeshLambertMaterial({ color: 0x2A3A4A });

        var building = new THREE.Mesh(
            new THREE.BoxGeometry(14, 5, 7),
            stationMat
        );
        building.position.set(WORLD_X - 60, 2.5, WORLD_Z + 20);
        scene.add(building);

        var roof = new THREE.Mesh(
            new THREE.BoxGeometry(15, 1.5, 8),
            roofMat
        );
        roof.position.set(WORLD_X - 60, 5.75, WORLD_Z + 20);
        scene.add(roof);

        var platform = new THREE.Mesh(
            new THREE.BoxGeometry(20, 0.5, 4),
            platformMat
        );
        platform.position.set(WORLD_X - 60, 0.25, WORLD_Z + 25.5);
        scene.add(platform);

        var chimney = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 2, 6),
            roofMat
        );
        chimney.position.set(WORLD_X - 63, 7.5, WORLD_Z + 20);
        scene.add(chimney);

        var win1 = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 1.5, 0.2),
            windowMat
        );
        win1.position.set(WORLD_X - 57, 2.5, WORLD_Z + 23.6);
        scene.add(win1);

        var win2 = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 1.5, 0.2),
            windowMat
        );
        win2.position.set(WORLD_X - 63, 2.5, WORLD_Z + 23.6);
        scene.add(win2);

        var door = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 2.5, 0.2),
            windowMat
        );
        door.position.set(WORLD_X - 60, 1.25, WORLD_Z + 23.6);
        scene.add(door);

        var signBoard = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.8, 0.1),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        signBoard.position.set(WORLD_X - 60, 4.2, WORLD_Z + 23.7);
        scene.add(signBoard);
    }

    function createLochWaters(scene) {
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x2A5A7A });

        var baWater1 = new THREE.Mesh(
            new THREE.BoxGeometry(60, 0.3, 40),
            waterMat
        );
        baWater1.position.set(WORLD_X + 120, 0.15, WORLD_Z - 80);
        scene.add(baWater1);

        var baWater2 = new THREE.Mesh(
            new THREE.BoxGeometry(40, 0.3, 25),
            waterMat
        );
        baWater2.position.set(WORLD_X + 170, 0.15, WORLD_Z - 60);
        scene.add(baWater2);

        var baWater3 = new THREE.Mesh(
            new THREE.BoxGeometry(30, 0.3, 20),
            waterMat
        );
        baWater3.position.set(WORLD_X + 90, 0.15, WORLD_Z - 100);
        scene.add(baWater3);

        var laidonWater1 = new THREE.Mesh(
            new THREE.BoxGeometry(80, 0.3, 50),
            waterMat
        );
        laidonWater1.position.set(WORLD_X - 140, 0.15, WORLD_Z + 100);
        scene.add(laidonWater1);

        var laidonWater2 = new THREE.Mesh(
            new THREE.BoxGeometry(55, 0.3, 35),
            waterMat
        );
        laidonWater2.position.set(WORLD_X - 110, 0.15, WORLD_Z + 60);
        scene.add(laidonWater2);

        var laidonWater3 = new THREE.Mesh(
            new THREE.BoxGeometry(45, 0.3, 30),
            waterMat
        );
        laidonWater3.position.set(WORLD_X - 180, 0.15, WORLD_Z + 130);
        scene.add(laidonWater3);

        var poolSmall1 = new THREE.Mesh(
            new THREE.BoxGeometry(15, 0.3, 10),
            waterMat
        );
        poolSmall1.position.set(WORLD_X + 50, 0.15, WORLD_Z + 50);
        scene.add(poolSmall1);

        var poolSmall2 = new THREE.Mesh(
            new THREE.BoxGeometry(20, 0.3, 12),
            waterMat
        );
        poolSmall2.position.set(WORLD_X - 30, 0.15, WORLD_Z - 60);
        scene.add(poolSmall2);
    }

    function createPeatBogMounds(scene) {
        var peatMat = new THREE.MeshLambertMaterial({ color: 0x3A2A1A });
        var peatLightMat = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });

        var moundPositions = [
            [WORLD_X + 10, WORLD_Z + 15],
            [WORLD_X - 20, WORLD_Z + 30],
            [WORLD_X + 45, WORLD_Z - 10],
            [WORLD_X - 50, WORLD_Z - 25],
            [WORLD_X + 70, WORLD_Z + 40],
            [WORLD_X - 80, WORLD_Z + 10],
            [WORLD_X + 100, WORLD_Z - 30],
            [WORLD_X - 100, WORLD_Z - 50],
            [WORLD_X + 15, WORLD_Z - 70],
            [WORLD_X - 35, WORLD_Z + 75],
            [WORLD_X + 60, WORLD_Z + 80],
            [WORLD_X - 65, WORLD_Z - 80],
            [WORLD_X + 130, WORLD_Z + 20],
            [WORLD_X - 130, WORLD_Z + 40],
            [WORLD_X + 80, WORLD_Z - 90],
            [WORLD_X + 5, WORLD_Z + 110],
            [WORLD_X - 90, WORLD_Z - 110],
            [WORLD_X + 150, WORLD_Z - 60],
            [WORLD_X - 160, WORLD_Z + 70],
            [WORLD_X + 200, WORLD_Z + 30],
            [WORLD_X - 200, WORLD_Z - 30],
            [WORLD_X + 40, WORLD_Z - 130],
            [WORLD_X - 40, WORLD_Z + 150]
        ];

        var i;
        for (i = 0; i < moundPositions.length; i++) {
            var w = 2 + (i % 4) * 1.5;
            var h = 0.3 + (i % 3) * 0.2;
            var d = 1.5 + (i % 5) * 1.0;
            var mat = (i % 2 === 0) ? peatMat : peatLightMat;
            var mound = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                mat
            );
            mound.position.set(moundPositions[i][0], h / 2, moundPositions[i][1]);
            scene.add(mound);
        }

        var tussockMat = new THREE.MeshLambertMaterial({ color: 0x5A4A2A });
        var tussockPositions = [
            [WORLD_X + 22, WORLD_Z - 5],
            [WORLD_X - 15, WORLD_Z + 55],
            [WORLD_X + 55, WORLD_Z + 22],
            [WORLD_X - 75, WORLD_Z - 35],
            [WORLD_X + 110, WORLD_Z + 10],
            [WORLD_X - 110, WORLD_Z + 60],
            [WORLD_X + 25, WORLD_Z + 90],
            [WORLD_X - 45, WORLD_Z - 95]
        ];

        var j;
        for (j = 0; j < tussockPositions.length; j++) {
            var tussock = new THREE.Mesh(
                new THREE.BoxGeometry(1.0, 0.5, 1.0),
                tussockMat
            );
            tussock.position.set(tussockPositions[j][0], 0.25, tussockPositions[j][1]);
            scene.add(tussock);
        }
    }

    function createDeerStalkerLodge(scene) {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
        var woodMat = new THREE.MeshLambertMaterial({ color: 0x7A5A3A });
        var darkMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });

        var lodge = new THREE.Mesh(
            new THREE.BoxGeometry(10, 5, 8),
            stoneMat
        );
        lodge.position.set(WORLD_X + 80, 2.5, WORLD_Z + 80);
        scene.add(lodge);

        var lodgeRoof = new THREE.Mesh(
            new THREE.BoxGeometry(11, 1.5, 9),
            roofMat
        );
        lodgeRoof.position.set(WORLD_X + 80, 5.75, WORLD_Z + 80);
        scene.add(lodgeRoof);

        var lodgeChimney = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.35, 2.5, 6),
            stoneMat
        );
        lodgeChimney.position.set(WORLD_X + 77, 7.5, WORLD_Z + 80);
        scene.add(lodgeChimney);

        var lodgeDoor = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 2.2, 0.2),
            darkMat
        );
        lodgeDoor.position.set(WORLD_X + 80, 1.1, WORLD_Z + 76.1);
        scene.add(lodgeDoor);

        var stables = new THREE.Mesh(
            new THREE.BoxGeometry(8, 3.5, 5),
            woodMat
        );
        stables.position.set(WORLD_X + 94, 1.75, WORLD_Z + 80);
        scene.add(stables);

        var stablesRoof = new THREE.Mesh(
            new THREE.BoxGeometry(9, 1.0, 6),
            roofMat
        );
        stablesRoof.position.set(WORLD_X + 94, 3.5, WORLD_Z + 80);
        scene.add(stablesRoof);

        var stablesDoor = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 2.5, 0.2),
            darkMat
        );
        stablesDoor.position.set(WORLD_X + 94, 1.25, WORLD_Z + 77.6);
        scene.add(stablesDoor);

        var postLeft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6),
            woodMat
        );
        postLeft.position.set(WORLD_X + 91, 0.75, WORLD_Z + 77.5);
        scene.add(postLeft);

        var postRight = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6),
            woodMat
        );
        postRight.position.set(WORLD_X + 97, 0.75, WORLD_Z + 77.5);
        scene.add(postRight);

        var rail = new THREE.Mesh(
            new THREE.BoxGeometry(6, 0.15, 0.15),
            woodMat
        );
        rail.position.set(WORLD_X + 94, 1.3, WORLD_Z + 77.5);
        scene.add(rail);
    }

    function createKingsHouseHotel(scene) {
        var whiteMat = new THREE.MeshLambertMaterial({ color: 0xF0F0F0 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x4A3A3A });
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xC0B0A0 });
        var darkMat = new THREE.MeshLambertMaterial({ color: 0x2A2A3A });
        var signMat = new THREE.MeshLambertMaterial({ color: 0x8B1A1A });

        var hotelBody = new THREE.Mesh(
            new THREE.BoxGeometry(16, 6, 10),
            whiteMat
        );
        hotelBody.position.set(WORLD_X - 100, 3, WORLD_Z - 120);
        scene.add(hotelBody);

        var hotelRoof = new THREE.Mesh(
            new THREE.BoxGeometry(17, 2, 11),
            roofMat
        );
        hotelRoof.position.set(WORLD_X - 100, 7, WORLD_Z - 120);
        scene.add(hotelRoof);

        var chimney1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 2.5, 6),
            stoneMat
        );
        chimney1.position.set(WORLD_X - 105, 9.25, WORLD_Z - 120);
        scene.add(chimney1);

        var chimney2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 2.5, 6),
            stoneMat
        );
        chimney2.position.set(WORLD_X - 95, 9.25, WORLD_Z - 120);
        scene.add(chimney2);

        var hotelDoor = new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 0.2),
            darkMat
        );
        hotelDoor.position.set(WORLD_X - 100, 1.5, WORLD_Z - 115.1);
        scene.add(hotelDoor);

        var win1h = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.8, 0.2),
            darkMat
        );
        win1h.position.set(WORLD_X - 106, 3.5, WORLD_Z - 115.1);
        scene.add(win1h);

        var win2h = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.8, 0.2),
            darkMat
        );
        win2h.position.set(WORLD_X - 94, 3.5, WORLD_Z - 115.1);
        scene.add(win2h);

        var win3h = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.8, 0.2),
            darkMat
        );
        win3h.position.set(WORLD_X - 108, 3.5, WORLD_Z - 124.9);
        scene.add(win3h);

        var win4h = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.8, 0.2),
            darkMat
        );
        win4h.position.set(WORLD_X - 92, 3.5, WORLD_Z - 124.9);
        scene.add(win4h);

        var sign = new THREE.Mesh(
            new THREE.BoxGeometry(6, 1.0, 0.15),
            signMat
        );
        sign.position.set(WORLD_X - 100, 5.0, WORLD_Z - 115.1);
        scene.add(sign);

        var stoneFoundation = new THREE.Mesh(
            new THREE.BoxGeometry(17, 0.5, 11),
            stoneMat
        );
        stoneFoundation.position.set(WORLD_X - 100, 0.25, WORLD_Z - 120);
        scene.add(stoneFoundation);

        var annex = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 6),
            whiteMat
        );
        annex.position.set(WORLD_X - 114, 2, WORLD_Z - 120);
        scene.add(annex);

        var annexRoof = new THREE.Mesh(
            new THREE.BoxGeometry(7, 1.2, 7),
            roofMat
        );
        annexRoof.position.set(WORLD_X - 114, 4.6, WORLD_Z - 120);
        scene.add(annexRoof);
    }

    function createCreagMhorRidge(scene) {
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
        var darkRockMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });

        var mainCliff = new THREE.Mesh(
            new THREE.BoxGeometry(40, 18, 12),
            cliffMat
        );
        mainCliff.position.set(WORLD_X + 180, 9, WORLD_Z - 150);
        scene.add(mainCliff);

        var cliffExtend = new THREE.Mesh(
            new THREE.BoxGeometry(25, 14, 10),
            cliffMat
        );
        cliffExtend.position.set(WORLD_X + 210, 7, WORLD_Z - 145);
        scene.add(cliffExtend);

        var cliffWing = new THREE.Mesh(
            new THREE.BoxGeometry(20, 12, 8),
            rockMat
        );
        cliffWing.position.set(WORLD_X + 155, 6, WORLD_Z - 155);
        scene.add(cliffWing);

        var fpos1 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 1.5, 4),
            darkRockMat
        );
        fpos1.position.set(WORLD_X + 175, 18.75, WORLD_Z - 147);
        scene.add(fpos1);

        var fpos2 = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 1.5, 3.5),
            darkRockMat
        );
        fpos2.position.set(WORLD_X + 185, 18.75, WORLD_Z - 146);
        scene.add(fpos2);

        var fpos3 = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 1.5, 4),
            darkRockMat
        );
        fpos3.position.set(WORLD_X + 192, 18.75, WORLD_Z - 147);
        scene.add(fpos3);

        var boulder1 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2.5, 3),
            rockMat
        );
        boulder1.position.set(WORLD_X + 165, 1.25, WORLD_Z - 162);
        scene.add(boulder1);

        var boulder2 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2.5),
            cliffMat
        );
        boulder2.position.set(WORLD_X + 202, 1.0, WORLD_Z - 140);
        scene.add(boulder2);

        var boulder3 = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 1.8, 2),
            darkRockMat
        );
        boulder3.position.set(WORLD_X + 220, 0.9, WORLD_Z - 155);
        scene.add(boulder3);

        var scree1 = new THREE.Mesh(
            new THREE.BoxGeometry(12, 3, 8),
            rockMat
        );
        scree1.position.set(WORLD_X + 180, 1.5, WORLD_Z - 135);
        scene.add(scree1);

        var scree2 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2, 6),
            cliffMat
        );
        scree2.position.set(WORLD_X + 160, 1.0, WORLD_Z - 140);
        scene.add(scree2);
    }

    function createDroversRoad(scene) {
        var cobbleMat = new THREE.MeshLambertMaterial({ color: 0xC8C8BE });
        var cobbleDarkMat = new THREE.MeshLambertMaterial({ color: 0xB0B0A8 });

        var cobblePositions = [
            [WORLD_X - 80, WORLD_Z + 5],
            [WORLD_X - 68, WORLD_Z + 3],
            [WORLD_X - 56, WORLD_Z + 6],
            [WORLD_X - 44, WORLD_Z + 4],
            [WORLD_X - 32, WORLD_Z + 2],
            [WORLD_X - 20, WORLD_Z + 5],
            [WORLD_X - 8, WORLD_Z + 3],
            [WORLD_X + 4, WORLD_Z + 4],
            [WORLD_X + 16, WORLD_Z + 2],
            [WORLD_X + 28, WORLD_Z + 5],
            [WORLD_X + 40, WORLD_Z + 3],
            [WORLD_X + 52, WORLD_Z + 4],
            [WORLD_X + 64, WORLD_Z + 2],
            [WORLD_X + 76, WORLD_Z + 5],
            [WORLD_X + 88, WORLD_Z + 3],
            [WORLD_X + 100, WORLD_Z + 4],
            [WORLD_X + 112, WORLD_Z + 2],
            [WORLD_X + 124, WORLD_Z + 5],
            [WORLD_X - 92, WORLD_Z + 8],
            [WORLD_X - 104, WORLD_Z + 6]
        ];

        var k;
        for (k = 0; k < cobblePositions.length; k++) {
            var mat = (k % 3 === 0) ? cobbleDarkMat : cobbleMat;
            var stone = new THREE.Mesh(
                new THREE.BoxGeometry(10, 0.25, 3),
                mat
            );
            stone.position.set(cobblePositions[k][0], 0.125, cobblePositions[k][1]);
            scene.add(stone);

            var edgeLeft = new THREE.Mesh(
                new THREE.BoxGeometry(10, 0.3, 0.4),
                cobbleDarkMat
            );
            edgeLeft.position.set(cobblePositions[k][0], 0.15, cobblePositions[k][1] - 1.7);
            scene.add(edgeLeft);

            var edgeRight = new THREE.Mesh(
                new THREE.BoxGeometry(10, 0.3, 0.4),
                cobbleDarkMat
            );
            edgeRight.position.set(cobblePositions[k][0], 0.15, cobblePositions[k][1] + 1.7);
            scene.add(edgeRight);
        }
    }

    function createMoorAtmosphere(scene) {
        var grassMat = new THREE.MeshLambertMaterial({ color: 0x6A7A4A });
        var heatherMat = new THREE.MeshLambertMaterial({ color: 0x7A4A6A });
        var grassDarkMat = new THREE.MeshLambertMaterial({ color: 0x4A5A3A });

        var moorBase = new THREE.Mesh(
            new THREE.BoxGeometry(500, 0.5, 500),
            grassDarkMat
        );
        moorBase.position.set(WORLD_X, -0.25, WORLD_Z);
        scene.add(moorBase);

        var heatherPatches = [
            [WORLD_X + 35, WORLD_Z + 60, 20, 16],
            [WORLD_X - 55, WORLD_Z + 90, 25, 18],
            [WORLD_X + 145, WORLD_Z - 30, 30, 20],
            [WORLD_X - 75, WORLD_Z - 80, 22, 15],
            [WORLD_X + 55, WORLD_Z + 130, 18, 14],
            [WORLD_X - 125, WORLD_Z + 55, 28, 20],
            [WORLD_X + 200, WORLD_Z + 70, 35, 22],
            [WORLD_X - 200, WORLD_Z - 70, 30, 18]
        ];

        var m;
        for (m = 0; m < heatherPatches.length; m++) {
            var heather = new THREE.Mesh(
                new THREE.BoxGeometry(heatherPatches[m][2], 0.4, heatherPatches[m][3]),
                heatherMat
            );
            heather.position.set(heatherPatches[m][0], 0.2, heatherPatches[m][1]);
            scene.add(heather);
        }

        var grassPatches = [
            [WORLD_X + 20, WORLD_Z - 50, 18, 12],
            [WORLD_X - 40, WORLD_Z + 20, 22, 14],
            [WORLD_X + 100, WORLD_Z + 60, 26, 18],
            [WORLD_X - 100, WORLD_Z - 60, 20, 14],
            [WORLD_X + 60, WORLD_Z - 100, 24, 16],
            [WORLD_X - 160, WORLD_Z + 30, 28, 18]
        ];

        var n;
        for (n = 0; n < grassPatches.length; n++) {
            var grass = new THREE.Mesh(
                new THREE.BoxGeometry(grassPatches[n][2], 0.35, grassPatches[n][3]),
                grassMat
            );
            grass.position.set(grassPatches[n][0], 0.175, grassPatches[n][1]);
            scene.add(grass);
        }

        var moundStone1 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.5, 3),
            new THREE.MeshLambertMaterial({ color: 0x6A6A5A })
        );
        moundStone1.position.set(WORLD_X + 3, 0.75, WORLD_Z - 30);
        scene.add(moundStone1);

        var moundStone2 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 1.2, 2.5),
            new THREE.MeshLambertMaterial({ color: 0x5A5A4A })
        );
        moundStone2.position.set(WORLD_X - 25, 0.6, WORLD_Z + 45);
        scene.add(moundStone2);

        var moundStone3 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 1.8, 4),
            new THREE.MeshLambertMaterial({ color: 0x6A6060 })
        );
        moundStone3.position.set(WORLD_X + 140, 0.9, WORLD_Z + 50);
        scene.add(moundStone3);
    }

    function init(scene) {
        createMoorAtmosphere(scene);
        createPeatBogMounds(scene);
        createLochWaters(scene);
        createBaBridge(scene);
        createRannochStation(scene);
        createDeerStalkerLodge(scene);
        createKingsHouseHotel(scene);
        createCreagMhorRidge(scene);
        createDroversRoad(scene);
    }

    return {
        init: init
    };

}());
