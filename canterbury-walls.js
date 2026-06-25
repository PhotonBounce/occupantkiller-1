window.CanterburyWalls = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 10520;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function buildCityWalls() {
        // Roman/medieval flint walls — rectangle encircling the city
        // North wall
        var wallGeoN = new THREE.BoxGeometry(300, 12, 5);
        var wallMatN = makeMaterial(0x8B7355);
        var wallN = new THREE.Mesh(wallGeoN, wallMatN);
        wallN.position.set(X_OFFSET, 6, -150);
        addMesh(wallN);

        // South wall
        var wallGeoS = new THREE.BoxGeometry(300, 12, 5);
        var wallMatS = makeMaterial(0x8B7355);
        var wallS = new THREE.Mesh(wallGeoS, wallMatS);
        wallS.position.set(X_OFFSET, 6, 150);
        addMesh(wallS);

        // East wall
        var wallGeoE = new THREE.BoxGeometry(5, 12, 300);
        var wallMatE = makeMaterial(0x8B7355);
        var wallE = new THREE.Mesh(wallGeoE, wallMatE);
        wallE.position.set(X_OFFSET + 150, 6, 0);
        addMesh(wallE);

        // West wall
        var wallGeoW = new THREE.BoxGeometry(5, 12, 300);
        var wallMatW = makeMaterial(0x8B7355);
        var wallW = new THREE.Mesh(wallGeoW, wallMatW);
        wallW.position.set(X_OFFSET - 150, 6, 0);
        addMesh(wallW);

        // Flint dark layer (Roman foundation) bottom band
        var foundGeoN = new THREE.BoxGeometry(300, 4, 5);
        var foundMat = makeMaterial(0x5A5A5A);
        var foundN = new THREE.Mesh(foundGeoN, foundMat);
        foundN.position.set(X_OFFSET, 2, -150);
        addMesh(foundN);

        var foundGeoS = new THREE.BoxGeometry(300, 4, 5);
        var foundMatS = makeMaterial(0x5A5A5A);
        var foundS = new THREE.Mesh(foundGeoS, foundMatS);
        foundS.position.set(X_OFFSET, 2, 150);
        addMesh(foundS);

        var foundGeoE = new THREE.BoxGeometry(5, 4, 300);
        var foundMatE = makeMaterial(0x5A5A5A);
        var foundE = new THREE.Mesh(foundGeoE, foundMatE);
        foundE.position.set(X_OFFSET + 150, 2, 0);
        addMesh(foundE);

        var foundGeoW = new THREE.BoxGeometry(5, 4, 300);
        var foundMatW = makeMaterial(0x5A5A5A);
        var foundW = new THREE.Mesh(foundGeoW, foundMatW);
        foundW.position.set(X_OFFSET - 150, 2, 0);
        addMesh(foundW);

        // Crenellated parapet — merlons along top of walls
        buildMerlons();

        // Interval towers — 6 round towers
        buildIntervalTowers();
    }

    function buildMerlons() {
        var merMat = makeMaterial(0x9B8365);
        var merGeo = new THREE.BoxGeometry(8, 4, 6);

        // North wall merlons
        var positions = [-100, -50, 0, 50, 100];
        for (var i = 0; i < positions.length; i++) {
            var mer = new THREE.Mesh(merGeo, merMat);
            mer.position.set(X_OFFSET + positions[i], 14, -150);
            addMesh(mer);
        }

        // South wall merlons
        for (var j = 0; j < positions.length; j++) {
            var merS = new THREE.Mesh(merGeo, merMat);
            merS.position.set(X_OFFSET + positions[j], 14, 150);
            addMesh(merS);
        }

        var merGeoSide = new THREE.BoxGeometry(6, 4, 8);
        var positionsZ = [-100, -50, 0, 50, 100];

        // East wall merlons
        for (var k = 0; k < positionsZ.length; k++) {
            var merE = new THREE.Mesh(merGeoSide, merMat);
            merE.position.set(X_OFFSET + 150, 14, positionsZ[k]);
            addMesh(merE);
        }

        // West wall merlons
        for (var m = 0; m < positionsZ.length; m++) {
            var merW = new THREE.Mesh(merGeoSide, merMat);
            merW.position.set(X_OFFSET - 150, 14, positionsZ[m]);
            addMesh(merW);
        }
    }

    function buildIntervalTowers() {
        // 6 interval towers — round cylinders
        var towerMat = makeMaterial(0x7A6B4A);
        var towerPositions = [
            [X_OFFSET - 150, 0, -75],
            [X_OFFSET - 150, 0, 75],
            [X_OFFSET + 150, 0, -75],
            [X_OFFSET + 150, 0, 75],
            [X_OFFSET - 50, 0, -150],
            [X_OFFSET + 50, 0, -150]
        ];

        for (var i = 0; i < towerPositions.length; i++) {
            var tGeo = new THREE.CylinderGeometry(5, 5, 16, 12);
            var tower = new THREE.Mesh(tGeo, towerMat);
            tower.position.set(towerPositions[i][0], 8, towerPositions[i][2]);
            addMesh(tower);

            // Cap
            var capGeo = new THREE.CylinderGeometry(5.5, 5.5, 2, 12);
            var capMat = makeMaterial(0x6B5C3A);
            var cap = new THREE.Mesh(capGeo, capMat);
            cap.position.set(towerPositions[i][0], 17, towerPositions[i][2]);
            addMesh(cap);
        }
    }

    function buildWestgateTowers() {
        // Two massive round flanking towers
        var towMatL = makeMaterial(0x8B7355);
        var towMatR = makeMaterial(0x8B7355);

        // Left tower (north)
        var leftGeo = new THREE.CylinderGeometry(8, 8, 22, 16);
        var leftTower = new THREE.Mesh(leftGeo, towMatL);
        leftTower.position.set(X_OFFSET - 170, 11, 0);
        addMesh(leftTower);

        // Right tower
        var rightGeo = new THREE.CylinderGeometry(8, 8, 22, 16);
        var rightTower = new THREE.Mesh(rightGeo, towMatR);
        rightTower.position.set(X_OFFSET - 152, 11, 0);
        addMesh(rightTower);

        // Machicolation ledge left
        var machLGeo = new THREE.CylinderGeometry(9.5, 9.5, 2, 16);
        var machMat = makeMaterial(0x6B5C3A);
        var machL = new THREE.Mesh(machLGeo, machMat);
        machL.position.set(X_OFFSET - 170, 23, 0);
        addMesh(machL);

        // Machicolation ledge right
        var machRGeo = new THREE.CylinderGeometry(9.5, 9.5, 2, 16);
        var machR = new THREE.Mesh(machRGeo, machMat);
        machR.position.set(X_OFFSET - 152, 23, 0);
        addMesh(machR);

        // Battlements top left
        var battL1Geo = new THREE.BoxGeometry(4, 3, 4);
        var battMat = makeMaterial(0x9B8365);
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var bx = Math.cos(angle) * 7;
            var bz = Math.sin(angle) * 7;
            var battL = new THREE.Mesh(battL1Geo, battMat);
            battL.position.set(X_OFFSET - 170 + bx, 25.5, bz);
            addMesh(battL);
        }

        // Battlements top right
        for (var j = 0; j < 8; j++) {
            var angleR = (j / 8) * Math.PI * 2;
            var rx = Math.cos(angleR) * 7;
            var rz = Math.sin(angleR) * 7;
            var battR = new THREE.Mesh(battL1Geo, battMat);
            battR.position.set(X_OFFSET - 152 + rx, 25.5, rz);
            addMesh(battR);
        }

        // Central arch passage (archway lintel and piers)
        var archLintelGeo = new THREE.BoxGeometry(18, 3, 4);
        var archMat = makeMaterial(0x7A6B4A);
        var archLintel = new THREE.Mesh(archLintelGeo, archMat);
        archLintel.position.set(X_OFFSET - 161, 10, 0);
        addMesh(archLintel);

        // Arch piers
        var pierGeo = new THREE.BoxGeometry(3, 10, 4);
        var pierL = new THREE.Mesh(pierGeo, archMat);
        pierL.position.set(X_OFFSET - 169, 5, 0);
        addMesh(pierL);

        var pierR = new THREE.Mesh(pierGeo, archMat);
        pierR.position.set(X_OFFSET - 153, 5, 0);
        addMesh(pierR);

        // Gatehouse connecting block
        var gateBlockGeo = new THREE.BoxGeometry(18, 22, 12);
        var gateBlockMat = makeMaterial(0x8B7355);
        var gateBlock = new THREE.Mesh(gateBlockGeo, gateBlockMat);
        gateBlock.position.set(X_OFFSET - 161, 11, 0);
        addMesh(gateBlock);
    }

    function buildDaneJohnMound() {
        // Roman burial mound — cylinder base with cone top
        var moundGeo = new THREE.CylinderGeometry(18, 22, 10, 16);
        var moundMat = makeMaterial(0x4A7C3F);
        var mound = new THREE.Mesh(moundGeo, moundMat);
        mound.position.set(X_OFFSET + 80, 5, 100);
        addMesh(mound);

        var peakGeo = new THREE.ConeGeometry(18, 8, 16);
        var peakMat = makeMaterial(0x3A6B2F);
        var peak = new THREE.Mesh(peakGeo, peakMat);
        peak.position.set(X_OFFSET + 80, 14, 100);
        addMesh(peak);

        // Garden paths (flat boxes radiating)
        var pathMat = makeMaterial(0xC8B880);
        var pathDirs = [
            [0, 30],
            [30, 0],
            [0, -30],
            [-30, 0]
        ];

        for (var i = 0; i < pathDirs.length; i++) {
            var pathGeo = new THREE.BoxGeometry(
                Math.abs(pathDirs[i][0]) > 0 ? 30 : 4,
                0.5,
                Math.abs(pathDirs[i][1]) > 0 ? 30 : 4
            );
            var path = new THREE.Mesh(pathGeo, pathMat);
            path.position.set(
                X_OFFSET + 80 + pathDirs[i][0],
                0.25,
                100 + pathDirs[i][1]
            );
            addMesh(path);
        }

        // Garden grass base
        var gardenGeo = new THREE.BoxGeometry(80, 0.3, 80);
        var gardenMat = makeMaterial(0x5A9E50);
        var garden = new THREE.Mesh(gardenGeo, gardenMat);
        garden.position.set(X_OFFSET + 80, 0.15, 100);
        addMesh(garden);

        // Obelisk/monument near mound
        var obeliskBaseGeo = new THREE.BoxGeometry(4, 2, 4);
        var obeliskMat = makeMaterial(0xB0A080);
        var obeliskBase = new THREE.Mesh(obeliskBaseGeo, obeliskMat);
        obeliskBase.position.set(X_OFFSET + 60, 1, 80);
        addMesh(obeliskBase);

        var obeliskGeo = new THREE.BoxGeometry(2, 12, 2);
        var obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
        obelisk.position.set(X_OFFSET + 60, 8, 80);
        addMesh(obelisk);

        var obeliskTopGeo = new THREE.ConeGeometry(1.5, 3, 4);
        var obeliskTop = new THREE.Mesh(obeliskTopGeo, obeliskMat);
        obeliskTop.position.set(X_OFFSET + 60, 15.5, 80);
        addMesh(obeliskTop);
    }

    function buildRiverStour() {
        // Meandering River Stour through the city
        // Represented as a series of flat box segments at slightly different angles

        var riverMat = makeMaterial(0x3A7EC8);

        // River segments meandering west to east through city
        var segments = [
            { x: X_OFFSET - 130, z: -30, w: 40, l: 10, ry: 0.1 },
            { x: X_OFFSET - 90, z: -20, w: 40, l: 10, ry: -0.05 },
            { x: X_OFFSET - 50, z: -25, w: 40, l: 10, ry: 0.08 },
            { x: X_OFFSET - 10, z: -20, w: 40, l: 10, ry: -0.06 },
            { x: X_OFFSET + 30, z: -15, w: 40, l: 10, ry: 0.1 },
            { x: X_OFFSET + 70, z: -20, w: 40, l: 10, ry: -0.05 },
            { x: X_OFFSET + 110, z: -30, w: 40, l: 10, ry: 0.07 }
        ];

        for (var i = 0; i < segments.length; i++) {
            var seg = segments[i];
            var riverGeo = new THREE.BoxGeometry(seg.w, 0.4, seg.l);
            var riverSeg = new THREE.Mesh(riverGeo, riverMat);
            riverSeg.position.set(seg.x, 0.2, seg.z);
            riverSeg.rotation.y = seg.ry;
            addMesh(riverSeg);
        }

        // Riverbanks
        var bankMat = makeMaterial(0x8B6914);
        for (var j = 0; j < segments.length; j++) {
            var s = segments[j];
            var bankGeoN = new THREE.BoxGeometry(s.w, 0.6, 2);
            var bankN = new THREE.Mesh(bankGeoN, bankMat);
            bankN.position.set(s.x, 0.3, s.z - s.l / 2 - 1);
            bankN.rotation.y = s.ry;
            addMesh(bankN);

            var bankGeoS = new THREE.BoxGeometry(s.w, 0.6, 2);
            var bankS = new THREE.Mesh(bankGeoS, bankMat);
            bankS.position.set(s.x, 0.3, s.z + s.l / 2 + 1);
            bankS.rotation.y = s.ry;
            addMesh(bankS);
        }

        // Punts / boats on river
        buildBoats();

        // Stone bridge over river
        buildStourBridge();
    }

    function buildBoats() {
        // Simple punt shapes — flat box hull
        var boatMat = makeMaterial(0x8B4513);
        var puntPositions = [
            [X_OFFSET - 40, -22],
            [X_OFFSET + 20, -18],
            [X_OFFSET + 70, -23]
        ];

        for (var i = 0; i < puntPositions.length; i++) {
            var hullGeo = new THREE.BoxGeometry(6, 0.8, 2.5);
            var hull = new THREE.Mesh(hullGeo, boatMat);
            hull.position.set(puntPositions[i][0], 0.8, puntPositions[i][1]);
            addMesh(hull);

            // Punt pole
            var poleMat = makeMaterial(0xA0522D);
            var poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 5, 4);
            var pole = new THREE.Mesh(poleGeo, poleMat);
            pole.rotation.z = 0.3;
            pole.position.set(puntPositions[i][0] + 1, 3, puntPositions[i][1]);
            addMesh(pole);
        }
    }

    function buildStourBridge() {
        // Medieval stone bridge over the Stour
        var bridgeMat = makeMaterial(0x9B8B6B);
        var bridgeDeckGeo = new THREE.BoxGeometry(12, 0.8, 14);
        var bridgeDeck = new THREE.Mesh(bridgeDeckGeo, bridgeMat);
        bridgeDeck.position.set(X_OFFSET, 1, -22);
        addMesh(bridgeDeck);

        // Bridge arch piers
        var bridgePierGeo = new THREE.BoxGeometry(3, 3, 2);
        var pierL = new THREE.Mesh(bridgePierGeo, bridgeMat);
        pierL.position.set(X_OFFSET - 3, 0.5, -22);
        addMesh(pierL);

        var pierR = new THREE.Mesh(bridgePierGeo, bridgeMat);
        pierR.position.set(X_OFFSET + 3, 0.5, -22);
        addMesh(pierR);

        // Bridge parapets
        var bParGeo = new THREE.BoxGeometry(12, 1, 0.5);
        var parN = new THREE.Mesh(bParGeo, bridgeMat);
        parN.position.set(X_OFFSET, 2, -27);
        addMesh(parN);

        var parS = new THREE.Mesh(bParGeo, bridgeMat);
        parS.position.set(X_OFFSET, 2, -17);
        addMesh(parS);
    }

    function buildPilgrimsWay() {
        // Cobbled street — dark grey surface
        var cobbleMat = makeMaterial(0x5C5C5C);
        var cobbleGeo = new THREE.BoxGeometry(200, 0.3, 8);
        var cobble = new THREE.Mesh(cobbleGeo, cobbleMat);
        cobble.position.set(X_OFFSET, 0.15, 40);
        addMesh(cobble);

        // Medieval timber-framed buildings along the Pilgrim's Way
        buildTimberBuildings();

        // Inn signs
        buildInnSigns();
    }

    function buildTimberBuildings() {
        // Buildings on north side of street
        var buildingDataN = [
            { x: X_OFFSET - 90, z: 50, w: 14, h: 10, d: 12 },
            { x: X_OFFSET - 70, z: 50, w: 12, h: 12, d: 12 },
            { x: X_OFFSET - 48, z: 50, w: 14, h: 9, d: 12 },
            { x: X_OFFSET - 28, z: 50, w: 12, h: 11, d: 12 },
            { x: X_OFFSET - 8, z: 50, w: 14, h: 10, d: 12 },
            { x: X_OFFSET + 14, z: 50, w: 12, h: 13, d: 12 },
            { x: X_OFFSET + 34, z: 50, w: 14, h: 9, d: 12 },
            { x: X_OFFSET + 54, z: 50, w: 12, h: 11, d: 12 },
            { x: X_OFFSET + 74, z: 50, w: 14, h: 10, d: 12 },
            { x: X_OFFSET + 94, z: 50, w: 12, h: 12, d: 12 }
        ];

        var wallColors = [0xD4B896, 0xC8A87A, 0xDECBA0, 0xC0A878, 0xD8BC94];
        var timberMat = makeMaterial(0x4A3728);

        for (var i = 0; i < buildingDataN.length; i++) {
            var b = buildingDataN[i];
            var wallColor = wallColors[i % wallColors.length];
            var wallMat = makeMaterial(wallColor);

            // Main building body
            var bodyGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
            var body = new THREE.Mesh(bodyGeo, wallMat);
            body.position.set(b.x, b.h / 2, b.z);
            addMesh(body);

            // Timber frame overlay (slightly proud of wall)
            var timberHGeo = new THREE.BoxGeometry(b.w, 0.5, b.d + 0.2);
            var timberH1 = new THREE.Mesh(timberHGeo, timberMat);
            timberH1.position.set(b.x, b.h * 0.33, b.z);
            addMesh(timberH1);

            var timberH2 = new THREE.Mesh(timberHGeo, timberMat);
            timberH2.position.set(b.x, b.h * 0.66, b.z);
            addMesh(timberH2);

            // Roof
            var roofGeo = new THREE.BoxGeometry(b.w + 1, 1, b.d + 1);
            var roofMat = makeMaterial(0x6B3A2A);
            var roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.set(b.x, b.h + 0.5, b.z);
            addMesh(roof);

            // Roof ridge
            var ridgeGeo = new THREE.BoxGeometry(b.w - 2, 4, 1);
            var ridge = new THREE.Mesh(ridgeGeo, roofMat);
            ridge.position.set(b.x, b.h + 3, b.z);
            addMesh(ridge);

            // Chimney
            var chimneyGeo = new THREE.BoxGeometry(2, 5, 2);
            var chimneyMat = makeMaterial(0x8B6B5A);
            var chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
            chimney.position.set(b.x + b.w * 0.3, b.h + 5, b.z);
            addMesh(chimney);
        }

        // Buildings on south side
        var buildingDataS = [
            { x: X_OFFSET - 80, z: 30, w: 14, h: 10, d: 12 },
            { x: X_OFFSET - 58, z: 30, w: 12, h: 12, d: 12 },
            { x: X_OFFSET - 36, z: 30, w: 14, h: 9, d: 12 },
            { x: X_OFFSET - 14, z: 30, w: 12, h: 11, d: 12 },
            { x: X_OFFSET + 8, z: 30, w: 14, h: 10, d: 12 },
            { x: X_OFFSET + 30, z: 30, w: 12, h: 13, d: 12 },
            { x: X_OFFSET + 52, z: 30, w: 14, h: 9, d: 12 },
            { x: X_OFFSET + 74, z: 30, w: 12, h: 11, d: 12 }
        ];

        for (var j = 0; j < buildingDataS.length; j++) {
            var bs = buildingDataS[j];
            var wallColorS = wallColors[j % wallColors.length];
            var wallMatS = makeMaterial(wallColorS);

            var bodyGeoS = new THREE.BoxGeometry(bs.w, bs.h, bs.d);
            var bodyS = new THREE.Mesh(bodyGeoS, wallMatS);
            bodyS.position.set(bs.x, bs.h / 2, bs.z);
            addMesh(bodyS);

            var timberHGeoS = new THREE.BoxGeometry(bs.w, 0.5, bs.d + 0.2);
            var timberHS = new THREE.Mesh(timberHGeoS, timberMat);
            timberHS.position.set(bs.x, bs.h * 0.5, bs.z);
            addMesh(timberHS);

            var roofGeoS = new THREE.BoxGeometry(bs.w + 1, 1, bs.d + 1);
            var roofMatS = makeMaterial(0x7A3B2B);
            var roofS = new THREE.Mesh(roofGeoS, roofMatS);
            roofS.position.set(bs.x, bs.h + 0.5, bs.z);
            addMesh(roofS);

            var ridgeGeoS = new THREE.BoxGeometry(bs.w - 2, 4, 1);
            var ridgeS = new THREE.Mesh(ridgeGeoS, roofMatS);
            ridgeS.position.set(bs.x, bs.h + 3, bs.z);
            addMesh(ridgeS);
        }
    }

    function buildInnSigns() {
        // Inn sign posts and boards
        var postMat = makeMaterial(0x5A3A20);
        var signMat = makeMaterial(0xC8A050);

        var signPositions = [
            X_OFFSET - 70,
            X_OFFSET - 10,
            X_OFFSET + 50
        ];

        for (var i = 0; i < signPositions.length; i++) {
            // Vertical post
            var postGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 6);
            var post = new THREE.Mesh(postGeo, postMat);
            post.position.set(signPositions[i], 4, 44);
            addMesh(post);

            // Horizontal arm
            var armGeo = new THREE.BoxGeometry(3, 0.3, 0.3);
            var arm = new THREE.Mesh(armGeo, postMat);
            arm.position.set(signPositions[i] + 1.5, 7, 44);
            addMesh(arm);

            // Sign board
            var boardGeo = new THREE.BoxGeometry(3, 2, 0.2);
            var board = new THREE.Mesh(boardGeo, signMat);
            board.position.set(signPositions[i] + 1.5, 6, 44);
            addMesh(board);
        }
    }

    function buildGroundPlane() {
        // Ground for the Canterbury area
        var groundGeo = new THREE.BoxGeometry(400, 0.5, 400);
        var groundMat = makeMaterial(0x7A9B6A);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(X_OFFSET, -0.25, 0);
        addMesh(ground);
    }

    function buildCathedral() {
        // Canterbury Cathedral silhouette in background
        var cathedralMat = makeMaterial(0x9B8B6B);

        // Nave
        var naveGeo = new THREE.BoxGeometry(30, 18, 70);
        var nave = new THREE.Mesh(naveGeo, cathedralMat);
        nave.position.set(X_OFFSET + 20, 9, -60);
        addMesh(nave);

        // Nave roof
        var naveRoofGeo = new THREE.BoxGeometry(31, 4, 71);
        var roofMat = makeMaterial(0x7A7060);
        var naveRoof = new THREE.Mesh(naveRoofGeo, roofMat);
        naveRoof.position.set(X_OFFSET + 20, 20, -60);
        addMesh(naveRoof);

        // Central tower (Bell Harry Tower)
        var ctGeo = new THREE.BoxGeometry(14, 40, 14);
        var ct = new THREE.Mesh(ctGeo, cathedralMat);
        ct.position.set(X_OFFSET + 20, 20, -55);
        addMesh(ct);

        // Tower crown
        var crownGeo = new THREE.BoxGeometry(15, 4, 15);
        var crown = new THREE.Mesh(crownGeo, cathedralMat);
        crown.position.set(X_OFFSET + 20, 42, -55);
        addMesh(crown);

        // Pinnacles on tower corners
        var pinnMat = makeMaterial(0x8A7A5A);
        var pinnPositions = [
            [X_OFFSET + 13, 46, -62],
            [X_OFFSET + 27, 46, -62],
            [X_OFFSET + 13, 46, -48],
            [X_OFFSET + 27, 46, -48]
        ];

        for (var i = 0; i < pinnPositions.length; i++) {
            var pinnGeo = new THREE.ConeGeometry(1.5, 6, 4);
            var pinn = new THREE.Mesh(pinnGeo, pinnMat);
            pinn.position.set(pinnPositions[i][0], pinnPositions[i][1], pinnPositions[i][2]);
            addMesh(pinn);
        }

        // Northwest tower
        var nwtGeo = new THREE.BoxGeometry(10, 28, 10);
        var nwt = new THREE.Mesh(nwtGeo, cathedralMat);
        nwt.position.set(X_OFFSET + 8, 14, -88);
        addMesh(nwt);

        // Southwest tower
        var swtGeo = new THREE.BoxGeometry(10, 28, 10);
        var swt = new THREE.Mesh(swtGeo, cathedralMat);
        swt.position.set(X_OFFSET + 32, 14, -88);
        addMesh(swt);
    }

    function build() {
        buildGroundPlane();
        buildCityWalls();
        buildWestgateTowers();
        buildDaneJohnMound();
        buildRiverStour();
        buildPilgrimsWay();
        buildCathedral();
    }

    function update(delta) {
        // No animated elements currently
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
