window.NewcastleKeep = (function() {
    'use strict';

    var WX = 2650;
    var WZ = 2200;

    function createCastleKeep(scene) {
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });

        // Hill base (flattened box)
        var hillGeo = new THREE.BoxGeometry(40, 6, 40);
        var hill = new THREE.Mesh(hillGeo, keepMat);
        hill.position.set(WX, 3, WZ);
        scene.add(hill);

        // Main Norman keep
        var keepGeo = new THREE.BoxGeometry(16, 18, 16);
        var keep = new THREE.Mesh(keepGeo, keepMat);
        keep.position.set(WX, 6 + 9, WZ);
        scene.add(keep);

        // Corner turrets
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x8A7A68 });
        var turretPositions = [
            [WX - 9, WZ - 9],
            [WX + 9, WZ - 9],
            [WX - 9, WZ + 9],
            [WX + 9, WZ + 9]
        ];
        for (var i = 0; i < turretPositions.length; i++) {
            var tGeo = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
            var turret = new THREE.Mesh(tGeo, turretMat);
            turret.position.set(turretPositions[i][0], 6 + 10, turretPositions[i][1]);
            scene.add(turret);
        }

        // Battlements on top of keep
        var battMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
        var battPositions = [
            [-6, -7], [-3, -7], [0, -7], [3, -7], [6, -7],
            [-6, 7],  [-3, 7],  [0, 7],  [3, 7],  [6, 7],
            [-7, -4], [-7, 0],  [-7, 4],
            [7, -4],  [7, 0],   [7, 4]
        ];
        for (var b = 0; b < battPositions.length; b++) {
            var battGeo = new THREE.BoxGeometry(2, 2, 2);
            var batt = new THREE.Mesh(battGeo, battMat);
            batt.position.set(WX + battPositions[b][0], 6 + 18 + 1, WZ + battPositions[b][1]);
            scene.add(batt);
        }
    }

    function createBlackGate(scene) {
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x7A6A58 });

        // Twin cylindrical towers of Black Gate barbican
        var tower1Geo = new THREE.CylinderGeometry(3, 3, 12, 8);
        var tower1 = new THREE.Mesh(tower1Geo, gateMat);
        tower1.position.set(WX - 22, 6, WZ - 5);
        scene.add(tower1);

        var tower2Geo = new THREE.CylinderGeometry(3, 3, 12, 8);
        var tower2 = new THREE.Mesh(tower2Geo, gateMat);
        tower2.position.set(WX - 22, 6, WZ + 5);
        scene.add(tower2);

        // Connecting gateway arch box
        var archGeo = new THREE.BoxGeometry(4, 8, 6);
        var arch = new THREE.Mesh(archGeo, gateMat);
        arch.position.set(WX - 22, 4, WZ);
        scene.add(arch);

        // Gatehouse above
        var houseGeo = new THREE.BoxGeometry(10, 6, 12);
        var house = new THREE.Mesh(houseGeo, gateMat);
        house.position.set(WX - 22, 12 + 3, WZ);
        scene.add(house);
    }

    function createCurtainWall(scene) {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });

        // Four sections of curtain wall
        var wallSegments = [
            { x: WX - 20, z: WZ - 18, w: 6, h: 8, d: 36 },
            { x: WX + 20, z: WZ - 18, w: 6, h: 8, d: 36 },
            { x: WX,      z: WZ - 20, w: 40, h: 8, d: 4 },
            { x: WX,      z: WZ + 20, w: 40, h: 8, d: 4 }
        ];

        for (var w = 0; w < wallSegments.length; w++) {
            var seg = wallSegments[w];
            var wGeo = new THREE.BoxGeometry(seg.w, seg.h, seg.d);
            var wall = new THREE.Mesh(wGeo, wallMat);
            wall.position.set(seg.x, seg.h / 2, seg.z);
            scene.add(wall);
        }
    }

    function createTyneBridge(scene) {
        // Bridge towers — stone
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8A8A2A });

        var towerGeo1 = new THREE.BoxGeometry(6, 16, 6);
        var tower1 = new THREE.Mesh(towerGeo1, towerMat);
        tower1.position.set(WX + 80, 8, WZ + 80);
        scene.add(tower1);

        var towerGeo2 = new THREE.BoxGeometry(6, 16, 6);
        var tower2 = new THREE.Mesh(towerGeo2, towerMat);
        tower2.position.set(WX + 130, 8, WZ + 80);
        scene.add(tower2);

        // Arch — iconic green arch spanning between towers
        var archMat = new THREE.MeshLambertMaterial({ color: 0x2A7A2A });

        // Left leg of arch
        var archLeg1Geo = new THREE.BoxGeometry(4, 20, 3);
        var archLeg1 = new THREE.Mesh(archLeg1Geo, archMat);
        archLeg1.position.set(WX + 85, 18, WZ + 80);
        archLeg1.rotation.z = 0.35;
        scene.add(archLeg1);

        // Right leg of arch
        var archLeg2Geo = new THREE.BoxGeometry(4, 20, 3);
        var archLeg2 = new THREE.Mesh(archLeg2Geo, archMat);
        archLeg2.position.set(WX + 125, 18, WZ + 80);
        archLeg2.rotation.z = -0.35;
        scene.add(archLeg2);

        // Top span of arch
        var archTopGeo = new THREE.BoxGeometry(50, 3, 4);
        var archTop = new THREE.Mesh(archTopGeo, archMat);
        archTop.position.set(WX + 105, 30, WZ + 80);
        scene.add(archTop);

        // Roadway deck box
        var deckMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var deckGeo = new THREE.BoxGeometry(60, 2, 8);
        var deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.set(WX + 105, 14, WZ + 80);
        scene.add(deck);

        // Vertical hanger boxes
        var hangerMat = new THREE.MeshLambertMaterial({ color: 0x2A7A2A });
        var hangerXPositions = [
            WX + 90, WX + 95, WX + 100, WX + 105, WX + 110, WX + 115, WX + 120
        ];
        for (var h = 0; h < hangerXPositions.length; h++) {
            var hGeo = new THREE.BoxGeometry(0.5, 14, 0.5);
            var hanger = new THREE.Mesh(hGeo, hangerMat);
            hanger.position.set(hangerXPositions[h], 21, WZ + 80);
            scene.add(hanger);
        }
    }

    function createMillenniumBridge(scene) {
        // Tilting arch — angled cylinder
        var archMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var archGeo = new THREE.CylinderGeometry(1.5, 1.5, 40, 8);
        var archMesh = new THREE.Mesh(archGeo, archMat);
        archMesh.position.set(WX + 60, 20, WZ + 120);
        archMesh.rotation.z = 0.5;
        scene.add(archMesh);

        // Bridge deck
        var deckMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var deckGeo = new THREE.BoxGeometry(40, 1, 5);
        var deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.set(WX + 60, 3, WZ + 120);
        scene.add(deck);

        // Cable line segments from arch to deck
        var cablePoints = [];
        var cableXStart = WX + 42;
        var cableStep = 4;
        for (var c = 0; c < 9; c++) {
            var cx = cableXStart + c * cableStep;
            // From deck level to arch
            cablePoints.push(cx, 3, WZ + 120);
            cablePoints.push(WX + 60 + (c - 4) * 2, 20, WZ + 120);
        }
        var cableGeo = new THREE.BufferGeometry();
        var cableArray = new Float32Array(cablePoints);
        cableGeo.setAttribute('position', new THREE.BufferAttribute(cableArray, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
        var cables = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cables);
    }

    function createBalticGallery(scene) {
        // Former flour mill, tall industrial building
        var brickMat = new THREE.MeshLambertMaterial({ color: 0x8A7A5A });

        var mainGeo = new THREE.BoxGeometry(14, 28, 14);
        var main = new THREE.Mesh(mainGeo, brickMat);
        main.position.set(WX + 90, 14, WZ + 150);
        scene.add(main);

        // Silo extensions
        var siloMat = new THREE.MeshLambertMaterial({ color: 0x7A6A4A });
        var silo1Geo = new THREE.CylinderGeometry(3, 3, 24, 8);
        var silo1 = new THREE.Mesh(silo1Geo, siloMat);
        silo1.position.set(WX + 84, 12, WZ + 150);
        scene.add(silo1);

        var silo2Geo = new THREE.CylinderGeometry(3, 3, 24, 8);
        var silo2 = new THREE.Mesh(silo2Geo, siloMat);
        silo2.position.set(WX + 96, 12, WZ + 150);
        scene.add(silo2);

        // Rooftop box (viewing gallery addition)
        var roofGeo = new THREE.BoxGeometry(16, 4, 16);
        var roofBox = new THREE.Mesh(roofGeo, new THREE.MeshLambertMaterial({ color: 0x6A6A6A }));
        roofBox.position.set(WX + 90, 30, WZ + 150);
        scene.add(roofBox);
    }

    function createSageGateshead(scene) {
        var steelMat = new THREE.MeshLambertMaterial({ color: 0x7A8A8A });

        // Three overlapping sections — sphere and box forms
        var sphere1Geo = new THREE.SphereGeometry(12, 12, 8);
        var sphere1 = new THREE.Mesh(sphere1Geo, steelMat);
        sphere1.position.set(WX + 50, 10, WZ + 170);
        scene.add(sphere1);

        var sphere2Geo = new THREE.SphereGeometry(10, 12, 8);
        var sphere2 = new THREE.Mesh(sphere2Geo, steelMat);
        sphere2.position.set(WX + 70, 9, WZ + 170);
        scene.add(sphere2);

        var box1Geo = new THREE.BoxGeometry(14, 14, 20);
        var box1 = new THREE.Mesh(box1Geo, steelMat);
        box1.position.set(WX + 30, 7, WZ + 170);
        scene.add(box1);

        // Roof curve suggestion — lower flattened sphere
        var roofGeo = new THREE.SphereGeometry(20, 12, 8);
        var roof = new THREE.Mesh(roofGeo, steelMat);
        roof.scale.y = 0.3;
        roof.position.set(WX + 55, 16, WZ + 170);
        scene.add(roof);
    }

    function createGreyStreet(scene) {
        // Row of 8 Georgian terraced facades
        var georgianMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });

        for (var g = 0; g < 8; g++) {
            var facadeGeo = new THREE.BoxGeometry(7, 14, 8);
            var facade = new THREE.Mesh(facadeGeo, georgianMat);
            facade.position.set(WX - 40 + g * 8, 7, WZ - 50 + g * 5);
            scene.add(facade);
        }

        // Grey's Monument — tall column
        var columnMat = new THREE.MeshLambertMaterial({ color: 0xD0C0A0 });
        var colGeo = new THREE.CylinderGeometry(1, 1.5, 25, 8);
        var column = new THREE.Mesh(colGeo, columnMat);
        column.position.set(WX - 45, 12.5, WZ - 60);
        scene.add(column);

        // Statue sphere on top
        var statueGeo = new THREE.SphereGeometry(1.5, 8, 8);
        var statue = new THREE.Mesh(statueGeo, columnMat);
        statue.position.set(WX - 45, 26.5, WZ - 60);
        scene.add(statue);
    }

    function createStreetLamps(scene) {
        var lampMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var globeMat = new THREE.MeshLambertMaterial({ color: 0xFFFFCC });

        var lampPositions = [
            [WX - 30, WZ - 40],
            [WX - 20, WZ - 45],
            [WX - 10, WZ - 50],
            [WX,      WZ - 55],
            [WX + 10, WZ - 60],
            [WX + 100, WZ + 85],
            [WX + 110, WZ + 85],
            [WX + 120, WZ + 85]
        ];

        for (var lp = 0; lp < lampPositions.length; lp++) {
            var poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 5, 6);
            var pole = new THREE.Mesh(poleGeo, lampMat);
            pole.position.set(lampPositions[lp][0], 2.5, lampPositions[lp][1]);
            scene.add(pole);

            var globeGeo = new THREE.SphereGeometry(0.4, 6, 6);
            var globe = new THREE.Mesh(globeGeo, globeMat);
            globe.position.set(lampPositions[lp][0], 5.4, lampPositions[lp][1]);
            scene.add(globe);
        }
    }

    function createRiverTyne(scene) {
        // River bed suggestion — flat box at low elevation
        var riverMat = new THREE.MeshLambertMaterial({ color: 0x2A4A6A });
        var riverGeo = new THREE.BoxGeometry(200, 1, 40);
        var river = new THREE.Mesh(riverGeo, riverMat);
        river.position.set(WX + 80, 0.5, WZ + 100);
        scene.add(river);

        // Riverbanks — quayside boxes
        var quayMat = new THREE.MeshLambertMaterial({ color: 0x6A6A6A });
        var quay1Geo = new THREE.BoxGeometry(200, 3, 8);
        var quay1 = new THREE.Mesh(quay1Geo, quayMat);
        quay1.position.set(WX + 80, 1.5, WZ + 80);
        scene.add(quay1);

        var quay2Geo = new THREE.BoxGeometry(200, 3, 8);
        var quay2 = new THREE.Mesh(quay2Geo, quayMat);
        quay2.position.set(WX + 80, 1.5, WZ + 128);
        scene.add(quay2);
    }

    function buildNewcastleKeep(scene) {
        createCastleKeep(scene);
        createBlackGate(scene);
        createCurtainWall(scene);
        createTyneBridge(scene);
        createMillenniumBridge(scene);
        createBalticGallery(scene);
        createSageGateshead(scene);
        createGreyStreet(scene);
        createStreetLamps(scene);
        createRiverTyne(scene);
    }

    return {
        build: buildNewcastleKeep,
        worldX: WX,
        worldZ: WZ
    };
}());
