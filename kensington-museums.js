window.KensingtonMuseums = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11200;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geometry, mat);
    }

    function buildNaturalHistoryMuseum() {
        var terracotta = 0xcc6633;
        var cream = 0xf5deb3;
        var darkTerracotta = 0xaa4422;

        // Main central hall / nave - long rectangular building
        var naveGeo = new THREE.BoxGeometry(120, 28, 60);
        var nave = makeMesh(naveGeo, terracotta);
        nave.position.set(X_OFFSET - 200, 14, -300);
        addMesh(nave);

        // Nave roof
        var naveRoofGeo = new THREE.BoxGeometry(124, 8, 64);
        var naveRoof = makeMesh(naveRoofGeo, cream);
        naveRoof.position.set(X_OFFSET - 200, 30, -300);
        addMesh(naveRoof);

        // Central tower above nave
        var centralTowerGeo = new THREE.BoxGeometry(24, 20, 24);
        var centralTower = makeMesh(centralTowerGeo, terracotta);
        centralTower.position.set(X_OFFSET - 200, 42, -300);
        addMesh(centralTower);

        // Central tower cone
        var centralConeGeo = new THREE.ConeGeometry(16, 18, 8);
        var centralCone = makeMesh(centralConeGeo, darkTerracotta);
        centralCone.position.set(X_OFFSET - 200, 60, -300);
        addMesh(centralCone);

        // Left wing
        var leftWingGeo = new THREE.BoxGeometry(50, 22, 60);
        var leftWing = makeMesh(leftWingGeo, terracotta);
        leftWing.position.set(X_OFFSET - 285, 11, -300);
        addMesh(leftWing);

        var leftWingRoofGeo = new THREE.BoxGeometry(54, 6, 64);
        var leftWingRoof = makeMesh(leftWingRoofGeo, cream);
        leftWingRoof.position.set(X_OFFSET - 285, 24, -300);
        addMesh(leftWingRoof);

        // Right wing
        var rightWingGeo = new THREE.BoxGeometry(50, 22, 60);
        var rightWing = makeMesh(rightWingGeo, terracotta);
        rightWing.position.set(X_OFFSET - 115, 11, -300);
        addMesh(rightWing);

        var rightWingRoofGeo = new THREE.BoxGeometry(54, 6, 64);
        var rightWingRoof = makeMesh(rightWingRoofGeo, cream);
        rightWingRoof.position.set(X_OFFSET - 115, 24, -300);
        addMesh(rightWingRoof);

        // Left front corner tower (octagonal via cylinder)
        var leftCornerTowerGeo = new THREE.CylinderGeometry(8, 8, 32, 8);
        var leftCornerTower = makeMesh(leftCornerTowerGeo, terracotta);
        leftCornerTower.position.set(X_OFFSET - 310, 16, -272);
        addMesh(leftCornerTower);

        var leftCornerConeGeo = new THREE.ConeGeometry(9, 16, 8);
        var leftCornerCone = makeMesh(leftCornerConeGeo, darkTerracotta);
        leftCornerCone.position.set(X_OFFSET - 310, 36, -272);
        addMesh(leftCornerCone);

        // Right front corner tower
        var rightCornerTowerGeo = new THREE.CylinderGeometry(8, 8, 32, 8);
        var rightCornerTower = makeMesh(rightCornerTowerGeo, terracotta);
        rightCornerTower.position.set(X_OFFSET - 90, 16, -272);
        addMesh(rightCornerTower);

        var rightCornerConeGeo = new THREE.ConeGeometry(9, 16, 8);
        var rightCornerCone = makeMesh(rightCornerConeGeo, darkTerracotta);
        rightCornerCone.position.set(X_OFFSET - 90, 36, -272);
        addMesh(rightCornerCone);

        // Left rear corner tower
        var leftRearTowerGeo = new THREE.CylinderGeometry(8, 8, 32, 8);
        var leftRearTower = makeMesh(leftRearTowerGeo, terracotta);
        leftRearTower.position.set(X_OFFSET - 310, 16, -328);
        addMesh(leftRearTower);

        var leftRearConeGeo = new THREE.ConeGeometry(9, 16, 8);
        var leftRearCone = makeMesh(leftRearConeGeo, darkTerracotta);
        leftRearCone.position.set(X_OFFSET - 310, 36, -328);
        addMesh(leftRearCone);

        // Right rear corner tower
        var rightRearTowerGeo = new THREE.CylinderGeometry(8, 8, 32, 8);
        var rightRearTower = makeMesh(rightRearTowerGeo, terracotta);
        rightRearTower.position.set(X_OFFSET - 90, 16, -328);
        addMesh(rightRearTower);

        var rightRearConeGeo = new THREE.ConeGeometry(9, 16, 8);
        var rightRearCone = makeMesh(rightRearConeGeo, darkTerracotta);
        rightRearCone.position.set(X_OFFSET - 90, 36, -328);
        addMesh(rightRearCone);

        // Arched window bands - decorative strips
        var windowBandFrontGeo = new THREE.BoxGeometry(116, 5, 2);
        var windowBandFront = makeMesh(windowBandFrontGeo, cream);
        windowBandFront.position.set(X_OFFSET - 200, 18, -271);
        addMesh(windowBandFront);

        var windowBandFront2Geo = new THREE.BoxGeometry(116, 3, 2);
        var windowBandFront2 = makeMesh(windowBandFront2Geo, darkTerracotta);
        windowBandFront2.position.set(X_OFFSET - 200, 10, -271);
        addMesh(windowBandFront2);

        // Front courtyard ground
        var courtyardGeo = new THREE.BoxGeometry(130, 1, 30);
        var courtyard = makeMesh(courtyardGeo, 0xccbbaa);
        courtyard.position.set(X_OFFSET - 200, 0.5, -255);
        addMesh(courtyard);

        // Front gate pillars
        var gateLeftGeo = new THREE.BoxGeometry(4, 12, 4);
        var gateLeft = makeMesh(gateLeftGeo, cream);
        gateLeft.position.set(X_OFFSET - 220, 6, -242);
        addMesh(gateLeft);

        var gateRightGeo = new THREE.BoxGeometry(4, 12, 4);
        var gateRight = makeMesh(gateRightGeo, cream);
        gateRight.position.set(X_OFFSET - 180, 6, -242);
        addMesh(gateRight);

        // Steps
        var stepsGeo = new THREE.BoxGeometry(60, 2, 8);
        var steps = makeMesh(stepsGeo, cream);
        steps.position.set(X_OFFSET - 200, 1, -268);
        addMesh(steps);
    }

    function buildRoyalAlbertHall() {
        var terracotta = 0xcc6633;
        var cream = 0xf5deb3;
        var bronze = 0x8b6914;
        var glassColor = 0xaaccdd;

        // Main elliptical drum
        var drumGeo = new THREE.CylinderGeometry(52, 52, 26, 32);
        var drum = makeMesh(drumGeo, terracotta);
        drum.position.set(X_OFFSET + 50, 13, -180);
        addMesh(drum);

        // Ornamental frieze band around middle
        var friezeGeo = new THREE.CylinderGeometry(53.5, 53.5, 5, 32);
        var frieze = makeMesh(friezeGeo, cream);
        frieze.position.set(X_OFFSET + 50, 18, -180);
        addMesh(frieze);

        // Lower base / plinth
        var baseDrumGeo = new THREE.CylinderGeometry(54, 56, 6, 32);
        var baseDrum = makeMesh(baseDrumGeo, terracotta);
        baseDrum.position.set(X_OFFSET + 50, 3, -180);
        addMesh(baseDrum);

        // Dome support ring
        var domeRingGeo = new THREE.CylinderGeometry(50, 52, 4, 32);
        var domeRing = makeMesh(domeRingGeo, bronze);
        domeRing.position.set(X_OFFSET + 50, 28, -180);
        addMesh(domeRing);

        // Glass and iron dome
        var domeGeo = new THREE.SphereGeometry(50, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
        var dome = makeMesh(domeGeo, glassColor);
        dome.position.set(X_OFFSET + 50, 30, -180);
        addMesh(dome);

        // Dome lantern on top
        var lanternGeo = new THREE.CylinderGeometry(6, 8, 8, 16);
        var lantern = makeMesh(lanternGeo, bronze);
        lantern.position.set(X_OFFSET + 50, 70, -180);
        addMesh(lantern);

        var lanternCapGeo = new THREE.ConeGeometry(6, 6, 16);
        var lanternCap = makeMesh(lanternCapGeo, bronze);
        lanternCap.position.set(X_OFFSET + 50, 77, -180);
        addMesh(lanternCap);

        // Portico entrance (south face)
        var porticoGeo = new THREE.BoxGeometry(24, 14, 8);
        var portico = makeMesh(porticoGeo, cream);
        portico.position.set(X_OFFSET + 50, 7, -128);
        addMesh(portico);

        var porticoRoofGeo = new THREE.BoxGeometry(26, 3, 10);
        var porticoRoof = makeMesh(porticoRoofGeo, terracotta);
        porticoRoof.position.set(X_OFFSET + 50, 14, -128);
        addMesh(porticoRoof);

        // Steps around base
        var stepsGeo = new THREE.CylinderGeometry(56, 58, 2, 32);
        var steps = makeMesh(stepsGeo, 0xddccbb);
        steps.position.set(X_OFFSET + 50, 1, -180);
        addMesh(steps);

        // Decorative columns around drum (simplified as thin boxes)
        var numCols = 16;
        for (var i = 0; i < numCols; i++) {
            var angle = (i / numCols) * Math.PI * 2;
            var colX = X_OFFSET + 50 + Math.cos(angle) * 52;
            var colZ = -180 + Math.sin(angle) * 52;
            var colGeo = new THREE.BoxGeometry(2, 26, 2);
            var col = makeMesh(colGeo, cream);
            col.position.set(colX, 13, colZ);
            addMesh(col);
        }
    }

    function buildAlbertMemorial() {
        var gold = 0xffd700;
        var darkGold = 0xb8860b;
        var stone = 0xaaaaaa;
        var darkStone = 0x888888;

        // Base plinth / steps - multiple levels
        var base3Geo = new THREE.BoxGeometry(38, 2, 38);
        var base3 = makeMesh(base3Geo, stone);
        base3.position.set(X_OFFSET + 50, 1, -90);
        addMesh(base3);

        var base2Geo = new THREE.BoxGeometry(30, 2, 30);
        var base2 = makeMesh(base2Geo, stone);
        base2.position.set(X_OFFSET + 50, 3, -90);
        addMesh(base2);

        var base1Geo = new THREE.BoxGeometry(22, 3, 22);
        var base1 = makeMesh(base1Geo, darkStone);
        base1.position.set(X_OFFSET + 50, 6, -90);
        addMesh(base1);

        // Podium for Albert's statue
        var podiumGeo = new THREE.BoxGeometry(10, 5, 10);
        var podium = makeMesh(podiumGeo, darkStone);
        podium.position.set(X_OFFSET + 50, 9.5, -90);
        addMesh(podium);

        // Albert seated figure - body (box)
        var bodyGeo = new THREE.BoxGeometry(4, 5, 3);
        var body = makeMesh(bodyGeo, gold);
        body.position.set(X_OFFSET + 50, 15, -90);
        addMesh(body);

        // Albert's head (sphere)
        var headGeo = new THREE.SphereGeometry(1.2, 8, 8);
        var head = makeMesh(headGeo, gold);
        head.position.set(X_OFFSET + 50, 18.5, -90);
        addMesh(head);

        // Gothic canopy - 4 corner spires
        var spirePositions = [
            [X_OFFSET + 41, -81],
            [X_OFFSET + 59, -81],
            [X_OFFSET + 41, -99],
            [X_OFFSET + 59, -99]
        ];
        for (var s = 0; s < spirePositions.length; s++) {
            var spireBaseGeo = new THREE.CylinderGeometry(1.5, 2, 14, 8);
            var spireBase = makeMesh(spireBaseGeo, darkGold);
            spireBase.position.set(spirePositions[s][0], 14, spirePositions[s][1]);
            addMesh(spireBase);

            var spireTipGeo = new THREE.ConeGeometry(2, 10, 8);
            var spireTip = makeMesh(spireTipGeo, gold);
            spireTip.position.set(spirePositions[s][0], 24, spirePositions[s][1]);
            addMesh(spireTip);
        }

        // Main central Gothic spire
        var mainSpireBaseGeo = new THREE.CylinderGeometry(4, 5, 22, 8);
        var mainSpireBase = makeMesh(mainSpireBaseGeo, darkGold);
        mainSpireBase.position.set(X_OFFSET + 50, 22, -90);
        addMesh(mainSpireBase);

        var mainSpireTipGeo = new THREE.ConeGeometry(5, 20, 8);
        var mainSpireTip = makeMesh(mainSpireTipGeo, gold);
        mainSpireTip.position.set(X_OFFSET + 50, 43, -90);
        addMesh(mainSpireTip);

        // Canopy roof / baldachin
        var canopyGeo = new THREE.BoxGeometry(20, 3, 20);
        var canopy = makeMesh(canopyGeo, darkGold);
        canopy.position.set(X_OFFSET + 50, 11, -90);
        addMesh(canopy);

        // 4 corner sculpture cluster groups (boxes representing grouped figures)
        var clusterPositions = [
            [X_OFFSET + 33, -73],
            [X_OFFSET + 67, -73],
            [X_OFFSET + 33, -107],
            [X_OFFSET + 67, -107]
        ];
        for (var c = 0; c < clusterPositions.length; c++) {
            var clusterGeo = new THREE.BoxGeometry(6, 5, 6);
            var cluster = makeMesh(clusterGeo, stone);
            cluster.position.set(clusterPositions[c][0], 2.5, clusterPositions[c][1]);
            addMesh(cluster);

            // Figures on cluster
            var fig1Geo = new THREE.BoxGeometry(1.5, 4, 1.5);
            var fig1 = makeMesh(fig1Geo, darkStone);
            fig1.position.set(clusterPositions[c][0] - 1.5, 7, clusterPositions[c][1]);
            addMesh(fig1);

            var fig2Geo = new THREE.BoxGeometry(1.5, 4, 1.5);
            var fig2 = makeMesh(fig2Geo, darkStone);
            fig2.position.set(clusterPositions[c][0] + 1.5, 7, clusterPositions[c][1]);
            addMesh(fig2);
        }
    }

    function buildVAMuseum() {
        var terracotta = 0xcc6633;
        var cream = 0xf5deb3;
        var darkTerracotta = 0xaa4422;
        var ironColor = 0x444444;

        // Main facade building block
        var mainGeo = new THREE.BoxGeometry(110, 24, 55);
        var main = makeMesh(mainGeo, terracotta);
        main.position.set(X_OFFSET - 200, 12, -120);
        addMesh(main);

        // Roof
        var roofGeo = new THREE.BoxGeometry(114, 6, 59);
        var roof = makeMesh(roofGeo, cream);
        roof.position.set(X_OFFSET - 200, 26, -120);
        addMesh(roof);

        // Central dome drum
        var domeDrumGeo = new THREE.CylinderGeometry(14, 14, 10, 16);
        var domeDrum = makeMesh(domeDrumGeo, terracotta);
        domeDrum.position.set(X_OFFSET - 200, 34, -120);
        addMesh(domeDrum);

        // Central dome
        var domeGeo = new THREE.SphereGeometry(14, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
        var dome = makeMesh(domeGeo, cream);
        dome.position.set(X_OFFSET - 200, 44, -120);
        addMesh(dome);

        // Dome lantern
        var lanternGeo = new THREE.CylinderGeometry(3, 4, 6, 8);
        var lantern = makeMesh(lanternGeo, darkTerracotta);
        lantern.position.set(X_OFFSET - 200, 58, -120);
        addMesh(lantern);

        var lanternCapGeo = new THREE.ConeGeometry(3, 5, 8);
        var lanternCap = makeMesh(lanternCapGeo, darkTerracotta);
        lanternCap.position.set(X_OFFSET - 200, 63, -120);
        addMesh(lanternCap);

        // Decorative facade details - window band
        var windowBandGeo = new THREE.BoxGeometry(106, 4, 2);
        var windowBand = makeMesh(windowBandGeo, cream);
        windowBand.position.set(X_OFFSET - 200, 14, -93);
        addMesh(windowBand);

        var windowBand2Geo = new THREE.BoxGeometry(106, 3, 2);
        var windowBand2 = makeMesh(windowBand2Geo, darkTerracotta);
        windowBand2.position.set(X_OFFSET - 200, 8, -93);
        addMesh(windowBand2);

        // Left wing extension
        var leftExtGeo = new THREE.BoxGeometry(30, 20, 55);
        var leftExt = makeMesh(leftExtGeo, terracotta);
        leftExt.position.set(X_OFFSET - 270, 10, -120);
        addMesh(leftExt);

        // Right wing extension
        var rightExtGeo = new THREE.BoxGeometry(30, 20, 55);
        var rightExt = makeMesh(rightExtGeo, terracotta);
        rightExt.position.set(X_OFFSET - 130, 10, -120);
        addMesh(rightExt);

        // Garden court interior - simple depression representation
        var gardenCourtGeo = new THREE.BoxGeometry(50, 1, 25);
        var gardenCourt = makeMesh(gardenCourtGeo, 0x558844);
        gardenCourt.position.set(X_OFFSET - 200, 0.6, -120);
        addMesh(gardenCourt);

        // Decorative ironwork gate (simplified)
        var gateFrameGeo = new THREE.BoxGeometry(16, 10, 1);
        var gateFrame = makeMesh(gateFrameGeo, ironColor);
        gateFrame.position.set(X_OFFSET - 200, 5, -92);
        addMesh(gateFrame);

        // Corner towers
        var corners = [
            [X_OFFSET - 255, -93],
            [X_OFFSET - 145, -93],
            [X_OFFSET - 255, -147],
            [X_OFFSET - 145, -147]
        ];
        for (var i = 0; i < corners.length; i++) {
            var cTowerGeo = new THREE.CylinderGeometry(5, 5, 26, 8);
            var cTower = makeMesh(cTowerGeo, terracotta);
            cTower.position.set(corners[i][0], 13, corners[i][1]);
            addMesh(cTower);

            var cConeGeo = new THREE.ConeGeometry(6, 10, 8);
            var cCone = makeMesh(cConeGeo, darkTerracotta);
            cCone.position.set(corners[i][0], 30, corners[i][1]);
            addMesh(cCone);
        }
    }

    function buildScienceMuseum() {
        var concrete = 0x999999;
        var glass = 0xaabbcc;
        var darkGrey = 0x666666;

        // Main flat-roof modernist block
        var mainGeo = new THREE.BoxGeometry(100, 20, 50);
        var main = makeMesh(mainGeo, concrete);
        main.position.set(X_OFFSET + 50, 10, -270);
        addMesh(main);

        // Flat roof
        var roofGeo = new THREE.BoxGeometry(104, 2, 54);
        var roof = makeMesh(roofGeo, darkGrey);
        roof.position.set(X_OFFSET + 50, 21, -270);
        addMesh(roof);

        // Upper floor setback
        var upperGeo = new THREE.BoxGeometry(80, 10, 40);
        var upper = makeMesh(upperGeo, concrete);
        upper.position.set(X_OFFSET + 50, 26, -270);
        addMesh(upper);

        var upperRoofGeo = new THREE.BoxGeometry(82, 2, 42);
        var upperRoof = makeMesh(upperRoofGeo, darkGrey);
        upperRoof.position.set(X_OFFSET + 50, 32, -270);
        addMesh(upperRoof);

        // Glass facade strips
        var glassFacadeGeo = new THREE.BoxGeometry(90, 16, 1);
        var glassFacade = makeMesh(glassFacadeGeo, glass);
        glassFacade.position.set(X_OFFSET + 50, 10, -246);
        addMesh(glassFacade);

        // Entrance canopy
        var canopyGeo = new THREE.BoxGeometry(20, 2, 10);
        var canopy = makeMesh(canopyGeo, darkGrey);
        canopy.position.set(X_OFFSET + 50, 6, -242);
        addMesh(canopy);

        // Support pillars for canopy
        var pillar1Geo = new THREE.CylinderGeometry(0.8, 0.8, 6, 6);
        var pillar1 = makeMesh(pillar1Geo, concrete);
        pillar1.position.set(X_OFFSET + 38, 3, -240);
        addMesh(pillar1);

        var pillar2Geo = new THREE.CylinderGeometry(0.8, 0.8, 6, 6);
        var pillar2 = makeMesh(pillar2Geo, concrete);
        pillar2.position.set(X_OFFSET + 62, 3, -240);
        addMesh(pillar2);

        // Side wing
        var sideWingGeo = new THREE.BoxGeometry(30, 16, 50);
        var sideWing = makeMesh(sideWingGeo, concrete);
        sideWing.position.set(X_OFFSET - 15, 8, -270);
        addMesh(sideWing);

        var sideWingRoofGeo = new THREE.BoxGeometry(32, 2, 52);
        var sideWingRoof = makeMesh(sideWingRoofGeo, darkGrey);
        sideWingRoof.position.set(X_OFFSET - 15, 17, -270);
        addMesh(sideWingRoof);
    }

    function buildExhibitionRoad() {
        var roadColor = 0x444444;
        var pavementColor = 0xbbbbaa;
        var lineColor = 0xffffff;

        // Exhibition Road main surface
        var roadGeo = new THREE.BoxGeometry(16, 0.5, 350);
        var road = makeMesh(roadGeo, roadColor);
        road.position.set(X_OFFSET - 60, 0.25, -175);
        addMesh(road);

        // Pavement left
        var pavLeft = new THREE.BoxGeometry(8, 0.4, 350);
        var pavLeftMesh = makeMesh(pavLeft, pavementColor);
        pavLeftMesh.position.set(X_OFFSET - 72, 0.2, -175);
        addMesh(pavLeftMesh);

        // Pavement right
        var pavRight = new THREE.BoxGeometry(8, 0.4, 350);
        var pavRightMesh = makeMesh(pavRight, pavementColor);
        pavRightMesh.position.set(X_OFFSET - 48, 0.2, -175);
        addMesh(pavRightMesh);

        // Road markings (dashes down center) as LineSegments
        var linePoints = [];
        for (var d = 0; d < 35; d++) {
            var lineZ = -350 + d * 10;
            linePoints.push(X_OFFSET - 60, 0.6, lineZ);
            linePoints.push(X_OFFSET - 60, 0.6, lineZ + 5);
        }
        var lineGeo = new THREE.BufferGeometry();
        var linePositions = new Float32Array(linePoints);
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        var lineMat = new THREE.LineBasicMaterial({ color: lineColor });
        var lines = new THREE.LineSegments(lineGeo, lineMat);
        scene.add(lines);
        objects.push(lines);

        // Street lamps along road
        var lampPositions = [
            -80, -120, -160, -200, -240, -280, -320
        ];
        for (var lp = 0; lp < lampPositions.length; lp++) {
            // Left lamp post
            var postGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
            var post = makeMesh(postGeo, 0x555555);
            post.position.set(X_OFFSET - 70, 4, lampPositions[lp]);
            addMesh(post);

            var lampGeo = new THREE.SphereGeometry(0.8, 6, 6);
            var lamp = makeMesh(lampGeo, 0xffffcc);
            lamp.position.set(X_OFFSET - 70, 8.5, lampPositions[lp]);
            addMesh(lamp);

            // Right lamp post
            var postGeo2 = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
            var post2 = makeMesh(postGeo2, 0x555555);
            post2.position.set(X_OFFSET - 50, 4, lampPositions[lp]);
            addMesh(post2);

            var lampGeo2 = new THREE.SphereGeometry(0.8, 6, 6);
            var lamp2 = makeMesh(lampGeo2, 0xffffcc);
            lamp2.position.set(X_OFFSET - 50, 8.5, lampPositions[lp]);
            addMesh(lamp2);
        }

        // South Kensington Underground Station entrance
        buildUndergroundEntrance();
    }

    function buildUndergroundEntrance() {
        var stationColor = 0x8b0000;
        var cream = 0xf5deb3;
        var redRing = 0xcc0000;

        // Station building
        var stationGeo = new THREE.BoxGeometry(14, 8, 10);
        var station = makeMesh(stationGeo, stationColor);
        station.position.set(X_OFFSET - 60, 4, -55);
        addMesh(station);

        // Station roof
        var stationRoofGeo = new THREE.BoxGeometry(16, 2, 12);
        var stationRoof = makeMesh(stationRoofGeo, cream);
        stationRoof.position.set(X_OFFSET - 60, 9, -55);
        addMesh(stationRoof);

        // Underground roundel - ring (torus approximated by cylinder + inner cylinder)
        var roundelOuterGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 16);
        var roundelOuter = makeMesh(roundelOuterGeo, redRing);
        roundelOuter.position.set(X_OFFSET - 60, 7, -50);
        roundelOuter.rotation.x = Math.PI / 2;
        addMesh(roundelOuter);

        // Entrance steps
        var entranceGeo = new THREE.BoxGeometry(8, 1, 4);
        var entrance = makeMesh(entranceGeo, 0xccbbaa);
        entrance.position.set(X_OFFSET - 60, 0.5, -50);
        addMesh(entrance);

        // Station sign board
        var signGeo = new THREE.BoxGeometry(8, 2, 0.5);
        var sign = makeMesh(signGeo, redRing);
        sign.position.set(X_OFFSET - 60, 7, -50.2);
        addMesh(sign);
    }

    function buildGroundPlane() {
        var groundColor = 0x557755;
        var pathColor = 0xccbbaa;

        // Main ground area
        var groundGeo = new THREE.BoxGeometry(550, 0.5, 450);
        var ground = makeMesh(groundGeo, groundColor);
        ground.position.set(X_OFFSET - 100, 0, -175);
        addMesh(ground);

        // Hyde Park / Kensington Gardens grass
        var parkGeo = new THREE.BoxGeometry(200, 0.5, 150);
        var park = makeMesh(parkGeo, 0x448844);
        park.position.set(X_OFFSET + 70, 0.3, -60);
        addMesh(park);

        // Paths between museums
        var path1Geo = new THREE.BoxGeometry(12, 0.4, 100);
        var path1 = makeMesh(path1Geo, pathColor);
        path1.position.set(X_OFFSET - 100, 0.2, -200);
        addMesh(path1);
    }

    function build() {
        buildGroundPlane();
        buildNaturalHistoryMuseum();
        buildRoyalAlbertHall();
        buildAlbertMemorial();
        buildVAMuseum();
        buildScienceMuseum();
        buildExhibitionRoad();
    }

    function update(delta) {
        // static environment — no per-frame updates needed
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
