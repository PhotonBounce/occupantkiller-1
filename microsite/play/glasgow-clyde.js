window.GlasgowClyde = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, mat, x, y, z) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addLine(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var line = new THREE.LineSegments(geo, mat);
        scene.add(line);
        objects.push(line);
        return line;
    }

    function build() {
        buildRiverClyde();
        buildBridges();
        buildFinniestonCrane();
        buildSECArmadillo();
        buildKelvingroveGallery();
        buildGlasgowCathedral();
        buildNecropolis();
    }

    function buildRiverClyde() {
        var OX = 15040;
        // River surface
        var riverMat = new THREE.MeshLambertMaterial({ color: 0x2a4a6b });
        var riverGeo = new THREE.BoxGeometry(600, 1, 120);
        addMesh(riverGeo, riverMat, OX, -0.5, 0);

        // North bank docklands
        var quayMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var southBankGeo = new THREE.BoxGeometry(600, 2, 40);
        addMesh(southBankGeo, quayMat, OX, 0, 70);

        var northBankGeo = new THREE.BoxGeometry(600, 2, 40);
        addMesh(northBankGeo, quayMat, OX, 0, -70);

        // Dockland warehouses north
        var warehouseMat = new THREE.MeshLambertMaterial({ color: 0x8b5e3c });
        var wh1 = new THREE.BoxGeometry(60, 18, 20);
        addMesh(wh1, warehouseMat, OX - 180, 9, -90);
        var wh2 = new THREE.BoxGeometry(60, 18, 20);
        addMesh(wh2, warehouseMat, OX - 100, 9, -90);
        var wh3 = new THREE.BoxGeometry(50, 14, 18);
        addMesh(wh3, warehouseMat, OX - 30, 7, -92);

        // Dockland warehouses south
        var wh4 = new THREE.BoxGeometry(70, 16, 22);
        addMesh(wh4, warehouseMat, OX + 150, 8, 92);
        var wh5 = new THREE.BoxGeometry(55, 20, 18);
        addMesh(wh5, warehouseMat, OX + 230, 10, 92);

        // River traffic - small boats
        var boatMat = new THREE.MeshLambertMaterial({ color: 0xcc3300 });
        var boat1Hull = new THREE.BoxGeometry(16, 3, 6);
        addMesh(boat1Hull, boatMat, OX - 50, 2, -10);
        var boat1Cab = new THREE.BoxGeometry(6, 4, 5);
        addMesh(boat1Cab, boatMat, OX - 47, 5, -10);

        var boatMat2 = new THREE.MeshLambertMaterial({ color: 0x334477 });
        var boat2Hull = new THREE.BoxGeometry(20, 4, 7);
        addMesh(boat2Hull, boatMat2, OX + 80, 2, 15);
        var boat2Cab = new THREE.BoxGeometry(8, 5, 6);
        addMesh(boat2Cab, boatMat2, OX + 82, 6, 15);

        // Cargo barge
        var bargeMat = new THREE.MeshLambertMaterial({ color: 0x666644 });
        var barge = new THREE.BoxGeometry(40, 3, 10);
        addMesh(barge, bargeMat, OX + 200, 1.5, -5);
    }

    function buildBridges() {
        var OX = 15040;
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var steelMat = new THREE.MeshLambertMaterial({ color: 0x6677aa });

        // Squiggly Bridge (Clyde Arc pedestrian bridge) - distinctive S-curve
        var sqDeckMat = new THREE.MeshLambertMaterial({ color: 0x99aacc });
        // Deck segments approximating S-curve
        var sq1 = new THREE.BoxGeometry(18, 2, 120);
        addMesh(sq1, sqDeckMat, OX - 220, 4, 0);
        var sq2 = new THREE.BoxGeometry(4, 12, 120);
        addMesh(sq2, sqDeckMat, OX - 220, 8, 0);
        // Arch over the river
        var archMat = new THREE.MeshLambertMaterial({ color: 0xaabbdd });
        var arch1 = new THREE.CylinderGeometry(1.5, 1.5, 110, 6);
        var archMesh = addMesh(arch1, archMat, OX - 220, 30, 0);
        archMesh.rotation.z = Math.PI / 4;
        // Cable lines for squiggly bridge
        var cablePts = [
            new THREE.Vector3(OX - 220, 58, -55),
            new THREE.Vector3(OX - 230, 5, -55),
            new THREE.Vector3(OX - 220, 58, -30),
            new THREE.Vector3(OX - 230, 5, -30),
            new THREE.Vector3(OX - 220, 58, 0),
            new THREE.Vector3(OX - 230, 5, 0),
            new THREE.Vector3(OX - 220, 58, 30),
            new THREE.Vector3(OX - 230, 5, 30),
            new THREE.Vector3(OX - 220, 58, 55),
            new THREE.Vector3(OX - 230, 5, 55)
        ];
        addLine(cablePts, 0xaabbdd);

        // George V Bridge - stone arch bridge
        var georgeVMat = new THREE.MeshLambertMaterial({ color: 0xbbaa99 });
        var gvDeck = new THREE.BoxGeometry(24, 4, 120);
        addMesh(gvDeck, georgeVMat, OX - 50, 5, 0);
        // Arch supports
        var gvArch1 = new THREE.CylinderGeometry(2.5, 2.5, 26, 8);
        addMesh(gvArch1, georgeVMat, OX - 50, 3, -30);
        var gvArch2 = new THREE.CylinderGeometry(2.5, 2.5, 26, 8);
        addMesh(gvArch2, georgeVMat, OX - 50, 3, 30);
        var gvArch3 = new THREE.CylinderGeometry(2.5, 2.5, 26, 8);
        addMesh(gvArch3, georgeVMat, OX - 50, 3, 0);

        // Kingston Bridge - motorway flyover (very large)
        var kbMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        var kbDeck = new THREE.BoxGeometry(50, 5, 130);
        addMesh(kbDeck, kbMat, OX + 120, 12, 0);
        // Pylons
        var kbPylon1 = new THREE.BoxGeometry(5, 30, 5);
        addMesh(kbPylon1, kbMat, OX + 105, 15, -58);
        var kbPylon2 = new THREE.BoxGeometry(5, 30, 5);
        addMesh(kbPylon2, kbMat, OX + 135, 15, -58);
        var kbPylon3 = new THREE.BoxGeometry(5, 30, 5);
        addMesh(kbPylon3, kbMat, OX + 105, 15, 58);
        var kbPylon4 = new THREE.BoxGeometry(5, 30, 5);
        addMesh(kbPylon4, kbMat, OX + 135, 15, 58);
    }

    function buildFinniestonCrane() {
        // Iconic 175-foot cantilever crane on north bank
        var OX = 15040;
        var CX = OX - 280;
        var CZ = -100;

        var steelMat = new THREE.MeshLambertMaterial({ color: 0x4466aa });
        var darkMat = new THREE.MeshLambertMaterial({ color: 0x334455 });

        // Base platform
        var base = new THREE.BoxGeometry(22, 6, 22);
        addMesh(base, steelMat, CX, 3, CZ);

        // Gantry legs (4 legs forming A-frame)
        var leg1 = new THREE.BoxGeometry(3, 50, 3);
        addMesh(leg1, steelMat, CX - 7, 28, CZ - 7);
        var leg2 = new THREE.BoxGeometry(3, 50, 3);
        addMesh(leg2, steelMat, CX + 7, 28, CZ - 7);
        var leg3 = new THREE.BoxGeometry(3, 50, 3);
        addMesh(leg3, steelMat, CX - 7, 28, CZ + 7);
        var leg4 = new THREE.BoxGeometry(3, 50, 3);
        addMesh(leg4, steelMat, CX + 7, 28, CZ + 7);

        // Cross bracing on gantry legs
        var brace1 = new THREE.BoxGeometry(14, 2, 2);
        addMesh(brace1, darkMat, CX, 15, CZ - 7);
        var brace2 = new THREE.BoxGeometry(14, 2, 2);
        addMesh(brace2, darkMat, CX, 30, CZ - 7);
        var brace3 = new THREE.BoxGeometry(14, 2, 2);
        addMesh(brace3, darkMat, CX, 45, CZ - 7);
        var brace4 = new THREE.BoxGeometry(2, 2, 14);
        addMesh(brace4, darkMat, CX - 7, 20, CZ);
        var brace5 = new THREE.BoxGeometry(2, 2, 14);
        addMesh(brace5, darkMat, CX + 7, 35, CZ);

        // Machinery house at top of gantry
        var machHouse = new THREE.BoxGeometry(18, 12, 18);
        addMesh(machHouse, steelMat, CX, 59, CZ);

        // Main vertical tower continuing up
        var tower = new THREE.BoxGeometry(10, 30, 10);
        addMesh(tower, steelMat, CX, 80, CZ);

        // Cantilever arm - box beam extending out over river
        var armLength = 55;
        var arm = new THREE.BoxGeometry(armLength, 4, 6);
        addMesh(arm, steelMat, CX + armLength / 2, 94, CZ);

        // Counterweight arm going backward
        var counterArm = new THREE.BoxGeometry(20, 4, 6);
        addMesh(counterArm, steelMat, CX - 14, 94, CZ);

        // Counterweight block
        var counterWeight = new THREE.BoxGeometry(12, 14, 10);
        addMesh(counterWeight, darkMat, CX - 22, 87, CZ);

        // Trolley on arm
        var trolley = new THREE.BoxGeometry(6, 5, 6);
        addMesh(trolley, darkMat, CX + 30, 92, CZ);

        // Hook block dangling
        var hookBlock = new THREE.BoxGeometry(4, 4, 4);
        addMesh(hookBlock, darkMat, CX + 30, 75, CZ);

        // Cable lines from arm to trolley and hook
        var craneCables = [
            new THREE.Vector3(CX, 96, CZ),
            new THREE.Vector3(CX + 55, 96, CZ),
            new THREE.Vector3(CX + 30, 96, CZ),
            new THREE.Vector3(CX + 30, 73, CZ),
            new THREE.Vector3(CX, 96, CZ - 3),
            new THREE.Vector3(CX + 55, 96, CZ - 3)
        ];
        addLine(craneCables, 0x888888);

        // Tower cable stays
        var towerCables = [
            new THREE.Vector3(CX, 95, CZ),
            new THREE.Vector3(CX - 5, 65, CZ - 8),
            new THREE.Vector3(CX, 95, CZ),
            new THREE.Vector3(CX + 5, 65, CZ - 8),
            new THREE.Vector3(CX, 95, CZ),
            new THREE.Vector3(CX - 5, 65, CZ + 8),
            new THREE.Vector3(CX, 95, CZ),
            new THREE.Vector3(CX + 5, 65, CZ + 8)
        ];
        addLine(towerCables, 0x6688aa);
    }

    function buildSECArmadillo() {
        // SEC Armadillo - distinctive curved shell venue
        var OX = 15040;
        var AX = OX - 100;
        var AZ = -140;

        var shellMat = new THREE.MeshLambertMaterial({ color: 0xccccdd });
        var glazeMat = new THREE.MeshLambertMaterial({ color: 0x8899bb });
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x999999 });

        // Base plinth
        var basePlinth = new THREE.BoxGeometry(80, 4, 60);
        addMesh(basePlinth, baseMat, AX, 2, AZ);

        // Armadillo shell - stacked curved box segments approximating the shape
        // Front large shell
        var shell1 = new THREE.BoxGeometry(75, 22, 50);
        addMesh(shell1, shellMat, AX, 15, AZ);

        // Curved roof approximation using stacked angled boxes
        var r1 = new THREE.BoxGeometry(70, 8, 45);
        var r1m = addMesh(r1, shellMat, AX, 30, AZ);
        r1m.rotation.x = 0.15;

        var r2 = new THREE.BoxGeometry(60, 7, 38);
        var r2m = addMesh(r2, shellMat, AX, 37, AZ - 3);
        r2m.rotation.x = 0.3;

        var r3 = new THREE.BoxGeometry(48, 6, 30);
        var r3m = addMesh(r3, shellMat, AX, 43, AZ - 7);
        r3m.rotation.x = 0.5;

        var r4 = new THREE.BoxGeometry(34, 5, 20);
        var r4m = addMesh(r4, shellMat, AX, 47, AZ - 13);
        r4m.rotation.x = 0.7;

        var r5 = new THREE.BoxGeometry(20, 4, 12);
        var r5m = addMesh(r5, shellMat, AX, 50, AZ - 20);
        r5m.rotation.x = 0.9;

        // Second smaller shell segment behind (armadillo multi-segment)
        var seg2 = new THREE.BoxGeometry(55, 16, 35);
        addMesh(seg2, shellMat, AX - 5, 12, AZ + 35);

        var seg2r = new THREE.BoxGeometry(50, 6, 30);
        var seg2rm = addMesh(seg2r, shellMat, AX - 5, 22, AZ + 32);
        seg2rm.rotation.x = -0.2;

        // Third segment
        var seg3 = new THREE.BoxGeometry(40, 12, 28);
        addMesh(seg3, shellMat, AX - 8, 9, AZ + 65);

        // Glazed entrance area
        var entrance = new THREE.BoxGeometry(30, 14, 8);
        addMesh(entrance, glazeMat, AX, 10, AZ - 28);

        var entDoor = new THREE.BoxGeometry(12, 10, 2);
        addMesh(entDoor, glazeMat, AX, 7, AZ - 32);

        // Canopy over entrance
        var canopy = new THREE.BoxGeometry(36, 2, 10);
        addMesh(canopy, shellMat, AX, 17, AZ - 28);
    }

    function buildKelvingroveGallery() {
        // Kelvingrove Art Gallery - Spanish Baroque red sandstone
        var OX = 15040;
        var KX = OX + 200;
        var KZ = 200;

        var sandMat = new THREE.MeshLambertMaterial({ color: 0xaa4422 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x884422 });
        var darkSandMat = new THREE.MeshLambertMaterial({ color: 0x883311 });

        // Main central hall - barrel vaulted (approximated as tall box)
        var centralHall = new THREE.BoxGeometry(40, 35, 80);
        addMesh(centralHall, sandMat, KX, 17, KZ);

        // Barrel vault roof
        var barrel = new THREE.CylinderGeometry(22, 22, 80, 8, 1, false, 0, Math.PI);
        var barrelM = addMesh(barrel, roofMat, KX, 40, KZ);
        barrelM.rotation.z = Math.PI / 2;
        barrelM.rotation.y = Math.PI / 2;

        // East wing
        var eastWing = new THREE.BoxGeometry(55, 28, 35);
        addMesh(eastWing, sandMat, KX + 47, 14, KZ + 15);

        // West wing
        var westWing = new THREE.BoxGeometry(55, 28, 35);
        addMesh(westWing, sandMat, KX - 47, 14, KZ + 15);

        // Twin towers - east (Spanish Baroque style)
        var towerEast = new THREE.BoxGeometry(14, 60, 14);
        addMesh(towerEast, sandMat, KX + 55, 30, KZ - 35);

        var towerWest = new THREE.BoxGeometry(14, 60, 14);
        addMesh(towerWest, sandMat, KX - 55, 30, KZ - 35);

        // Cone caps on towers
        var coneEast = new THREE.ConeGeometry(9, 18, 8);
        addMesh(coneEast, roofMat, KX + 55, 67, KZ - 35);

        var coneWest = new THREE.ConeGeometry(9, 18, 8);
        addMesh(coneWest, roofMat, KX - 55, 67, KZ - 35);

        // Corner turrets with cone caps - four corners
        var turretMat = new THREE.MeshLambertMaterial({ color: 0xbb4422 });
        var turretGeo = new THREE.CylinderGeometry(3.5, 3.5, 25, 8);

        addMesh(turretGeo.clone ? new THREE.CylinderGeometry(3.5, 3.5, 25, 8) : turretGeo, turretMat, KX + 68, 40, KZ - 25);
        addMesh(new THREE.CylinderGeometry(3.5, 3.5, 25, 8), turretMat, KX - 68, 40, KZ - 25);
        addMesh(new THREE.CylinderGeometry(3.5, 3.5, 25, 8), turretMat, KX + 68, 34, KZ + 30);
        addMesh(new THREE.CylinderGeometry(3.5, 3.5, 25, 8), turretMat, KX - 68, 34, KZ + 30);

        // Cone caps on turrets
        var turretConeGeo = new THREE.ConeGeometry(4.5, 10, 8);
        addMesh(new THREE.ConeGeometry(4.5, 10, 8), roofMat, KX + 68, 55, KZ - 25);
        addMesh(new THREE.ConeGeometry(4.5, 10, 8), roofMat, KX - 68, 55, KZ - 25);
        addMesh(new THREE.ConeGeometry(4.5, 10, 8), roofMat, KX + 68, 49, KZ + 30);
        addMesh(new THREE.ConeGeometry(4.5, 10, 8), roofMat, KX - 68, 49, KZ + 30);

        // Ornate facade detail blocks
        var facadeMat = new THREE.MeshLambertMaterial({ color: 0xcc5533 });
        for (var i = 0; i < 5; i++) {
            var colGeo = new THREE.BoxGeometry(3, 20, 3);
            addMesh(colGeo, facadeMat, KX - 18 + i * 9, 14, KZ - 40);
        }

        // Entrance steps
        var stepsMat = new THREE.MeshLambertMaterial({ color: 0xddccbb });
        var steps1 = new THREE.BoxGeometry(30, 2, 8);
        addMesh(steps1, stepsMat, KX, 1, KZ - 44);
        var steps2 = new THREE.BoxGeometry(26, 2, 6);
        addMesh(steps2, stepsMat, KX, 3, KZ - 41);
        var steps3 = new THREE.BoxGeometry(22, 2, 4);
        addMesh(steps3, stepsMat, KX, 5, KZ - 38);
    }

    function buildGlasgowCathedral() {
        // Glasgow Cathedral - medieval Gothic, square central tower
        var OX = 15040;
        var GX = OX + 350;
        var GZ = 250;

        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
        var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x444433 });

        // Lower Church / Crypt (below ground level, partially visible)
        var crypt = new THREE.BoxGeometry(30, 8, 40);
        addMesh(crypt, darkStoneMat, GX, -2, GZ + 10);

        // Nave
        var nave = new THREE.BoxGeometry(24, 26, 55);
        addMesh(nave, stoneMat, GX, 13, GZ);

        // Nave roof - pitched
        var naveRoof = new THREE.BoxGeometry(26, 10, 57);
        var naveRoofM = addMesh(naveRoof, roofMat, GX, 30, GZ);
        naveRoofM.rotation.z = 0;

        // Nave gable triangles approximated
        var gable1 = new THREE.ConeGeometry(13, 10, 4);
        var g1 = addMesh(gable1, roofMat, GX, 33, GZ - 28);
        g1.rotation.y = Math.PI / 4;

        var gable2 = new THREE.ConeGeometry(13, 10, 4);
        var g2 = addMesh(gable2, roofMat, GX, 33, GZ + 28);
        g2.rotation.y = Math.PI / 4;

        // Quire / Choir east
        var choir = new THREE.BoxGeometry(22, 24, 30);
        addMesh(choir, stoneMat, GX, 12, GZ + 42);

        // Blacader Aisle (south aisle extension)
        var blacader = new THREE.BoxGeometry(12, 15, 22);
        addMesh(blacader, stoneMat, GX - 18, 7, GZ + 10);
        var blacaderRoof = new THREE.BoxGeometry(13, 6, 24);
        addMesh(blacaderRoof, roofMat, GX - 18, 17, GZ + 10);

        // Central Square Tower (no spire - distinctive feature)
        var towerBase = new THREE.BoxGeometry(16, 50, 16);
        addMesh(towerBase, stoneMat, GX, 35, GZ - 5);

        // Tower top parapet
        var parapet = new THREE.BoxGeometry(18, 6, 18);
        addMesh(parapet, stoneMat, GX, 63, GZ - 5);

        // Pinnacles on tower corners
        var pinnGeo = new THREE.BoxGeometry(2.5, 8, 2.5);
        addMesh(pinnGeo, stoneMat, GX - 8, 68, GZ - 13);
        addMesh(new THREE.BoxGeometry(2.5, 8, 2.5), stoneMat, GX + 8, 68, GZ - 13);
        addMesh(new THREE.BoxGeometry(2.5, 8, 2.5), stoneMat, GX - 8, 68, GZ + 3);
        addMesh(new THREE.BoxGeometry(2.5, 8, 2.5), stoneMat, GX + 8, 68, GZ + 3);

        // Gothic windows (decorative boxes)
        var winMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
        for (var i = 0; i < 3; i++) {
            var winGeo = new THREE.BoxGeometry(3, 8, 1);
            addMesh(winGeo, winMat, GX - 8 + i * 8, 16, GZ - 28);
        }

        // Buttresses on nave
        var buttMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        for (var j = 0; j < 4; j++) {
            var butt = new THREE.BoxGeometry(4, 22, 5);
            addMesh(butt, buttMat, GX - 14, 11, GZ - 20 + j * 14);
            addMesh(new THREE.BoxGeometry(4, 22, 5), buttMat, GX + 14, 11, GZ - 20 + j * 14);
        }
    }

    function buildNecropolis() {
        // Victorian cemetery on hill behind Cathedral
        var OX = 15040;
        var NX = OX + 390;
        var NZ = 290;

        var hillMat = new THREE.MeshLambertMaterial({ color: 0x336622 });
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
        var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x555544 });

        // Hill base
        var hillBase = new THREE.CylinderGeometry(60, 80, 30, 8);
        addMesh(hillBase, hillMat, NX, 15, NZ);

        // Hill upper
        var hillTop = new THREE.CylinderGeometry(30, 60, 20, 8);
        addMesh(hillTop, hillMat, NX, 35, NZ);

        // Summit plateau
        var summit = new THREE.CylinderGeometry(20, 30, 8, 8);
        addMesh(summit, hillMat, NX, 47, NZ);

        // John Knox column at summit
        var columnBasePedestal = new THREE.BoxGeometry(5, 4, 5);
        addMesh(columnBasePedestal, stoneMat, NX, 53, NZ);

        var column = new THREE.CylinderGeometry(1.2, 1.5, 22, 8);
        addMesh(column, stoneMat, NX, 66, NZ);

        // John Knox statue (simplified box figure)
        var knoxyBody = new THREE.BoxGeometry(2.5, 5, 2);
        addMesh(knoxyBody, darkStoneMat, NX, 80, NZ);
        var knoxyHead = new THREE.SphereGeometry(1.2, 6, 6);
        addMesh(knoxyHead, darkStoneMat, NX, 84, NZ);

        // Mausoleums scattered on hill
        var mausMat = new THREE.MeshLambertMaterial({ color: 0x997766 });
        var mausRoofMat = new THREE.MeshLambertMaterial({ color: 0x776655 });

        // Large mausoleum
        var maus1 = new THREE.BoxGeometry(8, 10, 8);
        addMesh(maus1, mausMat, NX - 20, 32, NZ - 15);
        var maus1Roof = new THREE.CylinderGeometry(5, 5, 4, 8);
        addMesh(maus1Roof, mausRoofMat, NX - 20, 38, NZ - 15);

        // Column tomb
        var col1 = new THREE.CylinderGeometry(1, 1.5, 12, 8);
        addMesh(col1, stoneMat, NX + 15, 35, NZ - 20);
        var col1Cap = new THREE.SphereGeometry(2, 6, 6);
        addMesh(col1Cap, stoneMat, NX + 15, 43, NZ - 20);

        // Gothic tomb chapel
        var chapel = new THREE.BoxGeometry(6, 8, 8);
        addMesh(chapel, mausMat, NX + 25, 30, NZ + 10);
        var chapelGable = new THREE.ConeGeometry(4.5, 6, 4);
        var chapG = addMesh(chapelGable, mausRoofMat, NX + 25, 37, NZ + 10);
        chapG.rotation.y = Math.PI / 4;

        // Small obelisk
        var obeliskBase = new THREE.BoxGeometry(3, 2, 3);
        addMesh(obeliskBase, stoneMat, NX - 30, 21, NZ + 20);
        var obelisk = new THREE.BoxGeometry(2, 14, 2);
        addMesh(obelisk, stoneMat, NX - 30, 30, NZ + 20);
        var obeliskTop = new THREE.ConeGeometry(1.5, 4, 4);
        addMesh(obeliskTop, stoneMat, NX - 30, 41, NZ + 20);

        // Scattered grave markers
        var graveMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var gravePositions = [
            [NX - 35, NZ + 5],
            [NX - 40, NZ - 10],
            [NX + 35, NZ - 5],
            [NX + 40, NZ + 15],
            [NX + 10, NZ + 30],
            [NX - 10, NZ + 35],
            [NX + 45, NZ - 20],
            [NX - 45, NZ - 25]
        ];
        for (var g = 0; g < gravePositions.length; g++) {
            var gp = gravePositions[g];
            var graveStone = new THREE.BoxGeometry(1.5, 3.5, 0.4);
            addMesh(graveStone, graveMat, gp[0], 19, gp[1]);
        }

        // Atmospheric bridge connecting necropolis to cathedral area
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
        var necBridge = new THREE.BoxGeometry(8, 2, 22);
        addMesh(necBridge, bridgeMat, NX - 45, 12, NZ - 15);
        // Bridge walls
        var bWall1 = new THREE.BoxGeometry(8, 3, 2);
        addMesh(bWall1, bridgeMat, NX - 45, 13, NZ - 25);
        var bWall2 = new THREE.BoxGeometry(8, 3, 2);
        addMesh(bWall2, bridgeMat, NX - 45, 13, NZ - 4);
    }

    function update(delta) {
        // Static environment - no animation needed
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
