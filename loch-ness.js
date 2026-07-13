window.LochNess = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14800;

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

    function makeMesh(geo, color, flat) {
        var mat = new THREE.MeshLambertMaterial({ color: color, flatShading: flat ? true : false });
        return new THREE.Mesh(geo, mat);
    }

    function buildLoch() {
        // Main loch water body — very long rectangle, dark peaty water
        var waterGeo = new THREE.BoxGeometry(600, 2, 5000);
        var water = makeMesh(waterGeo, 0x050d18, false);
        water.position.set(X_OFFSET, -1, 0);
        addMesh(water);

        // Loch surface shimmer layer
        var surfaceGeo = new THREE.BoxGeometry(598, 1, 4998);
        var surface = makeMesh(surfaceGeo, 0x0a1a2e, false);
        surface.position.set(X_OFFSET, 0.5, 0);
        addMesh(surface);

        // Eastern forested hill slope
        var hillEastGeo = new THREE.BoxGeometry(400, 120, 5000);
        var hillEast = makeMesh(hillEastGeo, 0x1a3a1a, false);
        hillEast.position.set(X_OFFSET + 500, 50, 0);
        addMesh(hillEast);

        // Eastern hill top ridge
        var ridgeEastGeo = new THREE.BoxGeometry(200, 60, 4900);
        var ridgeEast = makeMesh(ridgeEastGeo, 0x152d15, false);
        ridgeEast.position.set(X_OFFSET + 650, 110, 0);
        addMesh(ridgeEast);

        // Western forested hill slope
        var hillWestGeo = new THREE.BoxGeometry(400, 120, 5000);
        var hillWest = makeMesh(hillWestGeo, 0x1e3d1e, false);
        hillWest.position.set(X_OFFSET - 500, 50, 0);
        addMesh(hillWest);

        // Western hill top ridge
        var ridgeWestGeo = new THREE.BoxGeometry(200, 60, 4900);
        var ridgeWest = makeMesh(ridgeWestGeo, 0x162e16, false);
        ridgeWest.position.set(X_OFFSET - 650, 110, 0);
        addMesh(ridgeWest);

        // Dark peat-coloured loch bed visible through edges
        var bedGeo = new THREE.BoxGeometry(580, 80, 4980);
        var bed = makeMesh(bedGeo, 0x030808, false);
        bed.position.set(X_OFFSET, -42, 0);
        addMesh(bed);

        // Ripple rings on water surface (flat boxes)
        var i;
        var ripplePositions = [
            [X_OFFSET + 80, -500],
            [X_OFFSET - 60, 200],
            [X_OFFSET + 120, 1000],
            [X_OFFSET - 40, -1500]
        ];
        for (i = 0; i < ripplePositions.length; i++) {
            var ripGeo = new THREE.CylinderGeometry(30, 35, 0.5, 8);
            var rip = makeMesh(ripGeo, 0x0d2440, false);
            rip.position.set(ripplePositions[i][0], 1.5, ripplePositions[i][1]);
            addMesh(rip);
        }

        // Shore gravel/rock edges east
        var shoreEGeo = new THREE.BoxGeometry(30, 8, 5000);
        var shoreE = makeMesh(shoreEGeo, 0x6b6560, false);
        shoreE.position.set(X_OFFSET + 315, 2, 0);
        addMesh(shoreE);

        // Shore gravel/rock edges west
        var shoreWGeo = new THREE.BoxGeometry(30, 8, 5000);
        var shoreW = makeMesh(shoreWGeo, 0x6b6560, false);
        shoreW.position.set(X_OFFSET - 315, 2, 0);
        addMesh(shoreW);
    }

    function buildUrquhartCastle() {
        // Rocky promontory jutting into loch on west shore
        var promptGeo = new THREE.BoxGeometry(160, 18, 120);
        var promt = makeMesh(promptGeo, 0x5a4e3c, true);
        promt.position.set(X_OFFSET - 200, 8, -800);
        addMesh(promt);

        // Promontory rock faces
        var rockGeo = new THREE.BoxGeometry(140, 10, 100);
        var rock = makeMesh(rockGeo, 0x4a3e2c, true);
        rock.position.set(X_OFFSET - 200, 18, -800);
        addMesh(rock);

        // Grant Tower — most intact, main cylindrical tower
        var towerGeo = new THREE.CylinderGeometry(14, 16, 55, 8);
        var tower = makeMesh(towerGeo, 0x8c7a5a, true);
        tower.position.set(X_OFFSET - 185, 44, -820);
        addMesh(tower);

        // Grant Tower battlements top
        var battGeo = new THREE.CylinderGeometry(15, 14, 6, 8);
        var batt = makeMesh(battGeo, 0x7a6a4a, true);
        batt.position.set(X_OFFSET - 185, 74, -820);
        addMesh(batt);

        // Tower merlon blocks (crenellations)
        var j;
        for (j = 0; j < 6; j++) {
            var mAngle = (j / 6) * Math.PI * 2;
            var mGeo = new THREE.BoxGeometry(5, 6, 5);
            var mMesh = makeMesh(mGeo, 0x6e5f3c, true);
            mMesh.position.set(
                X_OFFSET - 185 + Math.cos(mAngle) * 14,
                80,
                -820 + Math.sin(mAngle) * 14
            );
            addMesh(mMesh);
        }

        // Great Hall ruins — long roofless walls
        var hallNGeo = new THREE.BoxGeometry(80, 12, 5);
        var hallN = makeMesh(hallNGeo, 0x8a7858, true);
        hallN.position.set(X_OFFSET - 200, 22, -850);
        addMesh(hallN);

        var hallSGeo = new THREE.BoxGeometry(80, 8, 5);
        var hallS = makeMesh(hallSGeo, 0x8a7858, true);
        hallS.position.set(X_OFFSET - 200, 18, -790);
        addMesh(hallS);

        var hallWGeo = new THREE.BoxGeometry(5, 12, 60);
        var hallW = makeMesh(hallWGeo, 0x8a7858, true);
        hallW.position.set(X_OFFSET - 240, 22, -820);
        addMesh(hallW);

        // Partial east hall wall
        var hallEGeo = new THREE.BoxGeometry(5, 6, 30);
        var hallE = makeMesh(hallEGeo, 0x7a6848, true);
        hallE.position.set(X_OFFSET - 160, 16, -830);
        addMesh(hallE);

        // Gatehouse remains — twin stumps
        var gate1Geo = new THREE.BoxGeometry(12, 20, 12);
        var gate1 = makeMesh(gate1Geo, 0x8c7a5a, true);
        gate1.position.set(X_OFFSET - 225, 26, -768);
        addMesh(gate1);

        var gate2Geo = new THREE.BoxGeometry(12, 20, 12);
        var gate2 = makeMesh(gate2Geo, 0x8c7a5a, true);
        gate2.position.set(X_OFFSET - 207, 26, -768);
        addMesh(gate2);

        // Gate arch lintel
        var lintGeo = new THREE.BoxGeometry(22, 4, 8);
        var lint = makeMesh(lintGeo, 0x7c6a4a, true);
        lint.position.set(X_OFFSET - 216, 38, -768);
        addMesh(lint);

        // Nether bailey outer curtain wall
        var curtain1Geo = new THREE.BoxGeometry(5, 10, 80);
        var curtain1 = makeMesh(curtain1Geo, 0x7a6848, true);
        curtain1.position.set(X_OFFSET - 250, 18, -800);
        addMesh(curtain1);

        var curtain2Geo = new THREE.BoxGeometry(70, 10, 5);
        var curtain2 = makeMesh(curtain2Geo, 0x7a6848, true);
        curtain2.position.set(X_OFFSET - 215, 18, -760);
        addMesh(curtain2);

        // Boat landing — wooden jetty into loch
        var jettyGeo = new THREE.BoxGeometry(8, 2, 40);
        var jetty = makeMesh(jettyGeo, 0x5a3a1a, false);
        jetty.position.set(X_OFFSET - 175, 1, -800);
        addMesh(jetty);

        // Jetty posts
        var p;
        for (p = 0; p < 4; p++) {
            var postGeo = new THREE.CylinderGeometry(1, 1, 8, 4);
            var post = makeMesh(postGeo, 0x3a2a0a, false);
            post.position.set(X_OFFSET - 172 + p * 3, -1, -800 + p * 10);
            addMesh(post);
        }

        // Castle grassy interior ground
        var courtGeo = new THREE.BoxGeometry(90, 3, 90);
        var court = makeMesh(courtGeo, 0x3a5a2a, false);
        court.position.set(X_OFFSET - 200, 19, -810);
        addMesh(court);

        // Broken wall rubble piles
        var rubble1Geo = new THREE.BoxGeometry(20, 4, 15);
        var rubble1 = makeMesh(rubble1Geo, 0x6a5a3a, true);
        rubble1.position.set(X_OFFSET - 190, 21, -800);
        addMesh(rubble1);

        var rubble2Geo = new THREE.BoxGeometry(12, 3, 10);
        var rubble2 = makeMesh(rubble2Geo, 0x6a5a3a, true);
        rubble2.position.set(X_OFFSET - 220, 20, -840);
        addMesh(rubble2);
    }

    function buildNessie() {
        // Nessie emerging from loch — dark grey-green
        var nessieX = X_OFFSET + 50;
        var nessieZ = -200;

        // Body hump 1 (main, largest)
        var hump1Geo = new THREE.SphereGeometry(22, 8, 6);
        var hump1 = makeMesh(hump1Geo, 0x2d3d2a, false);
        hump1.position.set(nessieX, 12, nessieZ);
        addMesh(hump1);

        // Body hump 2
        var hump2Geo = new THREE.SphereGeometry(16, 8, 6);
        var hump2 = makeMesh(hump2Geo, 0x2d3d2a, false);
        hump2.position.set(nessieX + 40, 8, nessieZ + 15);
        addMesh(hump2);

        // Body hump 3 (tail end)
        var hump3Geo = new THREE.SphereGeometry(10, 8, 6);
        var hump3 = makeMesh(hump3Geo, 0x2d3d2a, false);
        hump3.position.set(nessieX + 72, 4, nessieZ + 25);
        addMesh(hump3);

        // Long neck (cylinder)
        var neckGeo = new THREE.CylinderGeometry(5, 9, 45, 7);
        var neck = makeMesh(neckGeo, 0x2d3d2a, false);
        neck.rotation.z = -0.3;
        neck.position.set(nessieX - 32, 28, nessieZ - 8);
        addMesh(neck);

        // Small head (sphere)
        var headGeo = new THREE.SphereGeometry(8, 8, 6);
        var head = makeMesh(headGeo, 0x2d3d2a, false);
        head.position.set(nessieX - 45, 52, nessieZ - 12);
        addMesh(head);

        // Snout/nose bump
        var snoutGeo = new THREE.SphereGeometry(4, 6, 4);
        var snout = makeMesh(snoutGeo, 0x253323, false);
        snout.position.set(nessieX - 53, 50, nessieZ - 14);
        addMesh(snout);

        // Eye bumps
        var eye1Geo = new THREE.SphereGeometry(1.5, 4, 4);
        var eye1 = makeMesh(eye1Geo, 0x1a1a0a, false);
        eye1.position.set(nessieX - 50, 55, nessieZ - 8);
        addMesh(eye1);

        var eye2Geo = new THREE.SphereGeometry(1.5, 4, 4);
        var eye2 = makeMesh(eye2Geo, 0x1a1a0a, false);
        eye2.position.set(nessieX - 50, 55, nessieZ - 16);
        addMesh(eye2);

        // Ripple rings around Nessie where it enters water
        var rip1Geo = new THREE.CylinderGeometry(38, 42, 0.5, 10);
        var rip1 = makeMesh(rip1Geo, 0x0d2440, false);
        rip1.position.set(nessieX + 5, 1, nessieZ + 5);
        addMesh(rip1);

        var rip2Geo = new THREE.CylinderGeometry(55, 60, 0.3, 10);
        var rip2 = makeMesh(rip2Geo, 0x091c32, false);
        rip2.position.set(nessieX + 5, 0.8, nessieZ + 5);
        addMesh(rip2);

        // Water disturbance splash (small white boxes)
        var splash1Geo = new THREE.BoxGeometry(6, 4, 6);
        var splash1 = makeMesh(splash1Geo, 0x8ab8d0, false);
        splash1.position.set(nessieX - 18, 3, nessieZ + 10);
        addMesh(splash1);

        var splash2Geo = new THREE.BoxGeometry(4, 3, 4);
        var splash2 = makeMesh(splash2Geo, 0x8ab8d0, false);
        splash2.position.set(nessieX + 20, 2, nessieZ - 10);
        addMesh(splash2);
    }

    function buildCaledonianCanal() {
        // Canal enters from south end of loch — towpath and canal basin
        var canalX = X_OFFSET - 280;
        var canalZ = 1800;

        // Canal water channel
        var canalGeo = new THREE.BoxGeometry(40, 3, 300);
        var canal = makeMesh(canalGeo, 0x1a3a50, false);
        canal.position.set(canalX, 1, canalZ);
        addMesh(canal);

        // Canal towpath east side
        var towpathEGeo = new THREE.BoxGeometry(15, 2, 300);
        var towpathE = makeMesh(towpathEGeo, 0x8a7a5a, false);
        towpathE.position.set(canalX + 28, 2, canalZ);
        addMesh(towpathE);

        // Canal towpath west side
        var towpathWGeo = new THREE.BoxGeometry(15, 2, 300);
        var towpathW = makeMesh(towpathWGeo, 0x8a7a5a, false);
        towpathW.position.set(canalX - 28, 2, canalZ);
        addMesh(towpathW);

        // Lock keeper's cottage
        var cotGeo = new THREE.BoxGeometry(18, 14, 22);
        var cot = makeMesh(cotGeo, 0xc8b898, false);
        cot.position.set(canalX + 45, 9, canalZ - 60);
        addMesh(cotGeo);
        var cottage = makeMesh(cotGeo, 0xc8b898, false);
        cottage.position.set(canalX + 45, 9, canalZ - 60);
        addMesh(cottage);

        // Cottage roof
        var cotRoofGeo = new THREE.ConeGeometry(16, 10, 4);
        var cotRoof = makeMesh(cotRoofGeo, 0x5a3a2a, false);
        cotRoof.position.set(canalX + 45, 22, canalZ - 60);
        cotRoof.rotation.y = Math.PI / 4;
        addMesh(cotRoof);

        // Neptune's Staircase — 8 lock gates represented as paired walls
        var k;
        for (k = 0; k < 8; k++) {
            var lockZ = canalZ + 20 + k * 30;

            // Lock gate left beam
            var gateL = new THREE.BoxGeometry(4, 10, 2);
            var gateLMesh = makeMesh(gateL, 0x2a1a0a, false);
            gateLMesh.position.set(canalX - 20, 7, lockZ);
            addMesh(gateLMesh);

            // Lock gate right beam
            var gateR = new THREE.BoxGeometry(4, 10, 2);
            var gateRMesh = makeMesh(gateR, 0x2a1a0a, false);
            gateRMesh.position.set(canalX + 20, 7, lockZ);
            addMesh(gateRMesh);

            // Lock chamber walls
            var lockWallLGeo = new THREE.BoxGeometry(3, 8, 28);
            var lockWallL = makeMesh(lockWallLGeo, 0x6a5a3a, false);
            lockWallL.position.set(canalX - 22, 5, lockZ + 14);
            addMesh(lockWallL);

            var lockWallRGeo = new THREE.BoxGeometry(3, 8, 28);
            var lockWallR = makeMesh(lockWallRGeo, 0x6a5a3a, false);
            lockWallR.position.set(canalX + 22, 5, lockZ + 14);
            addMesh(lockWallR);

            // Water in lock
            var lockWaterGeo = new THREE.BoxGeometry(38, 1, 26);
            var lockWater = makeMesh(lockWaterGeo, 0x1a3a50, false);
            lockWater.position.set(canalX, 1.5, lockZ + 14);
            addMesh(lockWater);
        }

        // Canal basin at loch entrance
        var basinGeo = new THREE.BoxGeometry(80, 3, 60);
        var basin = makeMesh(basinGeo, 0x1a3a50, false);
        basin.position.set(canalX, 1, canalZ - 150);
        addMesh(basin);

        // Mooring bollards
        var b;
        for (b = 0; b < 4; b++) {
            var bollardGeo = new THREE.CylinderGeometry(1.5, 1.5, 5, 5);
            var bollard = makeMesh(bollardGeo, 0x222222, false);
            bollard.position.set(canalX + 30 + (b % 2) * 20, 4, canalZ - 140 + Math.floor(b / 2) * 20);
            addMesh(bollard);
        }
    }

    function buildDrumnadrochit() {
        // Village sits on west shore north of castle
        var villX = X_OFFSET - 350;
        var villZ = -400;

        // A82 road along lochside
        var roadGeo = new THREE.BoxGeometry(12, 1, 800);
        var road = makeMesh(roadGeo, 0x3a3a3a, false);
        road.position.set(villX + 60, 1, villZ + 100);
        addMesh(road);

        // Road markings (centre line)
        var markGeo = new THREE.BoxGeometry(1.5, 0.5, 700);
        var mark = makeMesh(markGeo, 0xe8e0c0, false);
        mark.position.set(villX + 60, 1.5, villZ + 100);
        addMesh(mark);

        // Loch Ness Centre exhibition building (large modern block)
        var exhibGeo = new THREE.BoxGeometry(60, 16, 40);
        var exhib = makeMesh(exhibGeo, 0xd4c8a0, false);
        exhib.position.set(villX, 10, villZ);
        addMesh(exhib);

        // Exhibition building roof
        var exhibRoofGeo = new THREE.BoxGeometry(64, 4, 44);
        var exhibRoof = makeMesh(exhibRoofGeo, 0x5a4a3a, false);
        exhibRoof.position.set(villX, 20, villZ);
        addMesh(exhibRoof);

        // Exhibition sign board
        var signGeo = new THREE.BoxGeometry(30, 6, 1);
        var sign = makeMesh(signGeo, 0x2a1a6a, false);
        sign.position.set(villX, 14, villZ - 21);
        addMesh(sign);

        // Drumnadrochit Hotel — larger Victorian building
        var hotelGeo = new THREE.BoxGeometry(35, 22, 28);
        var hotel = makeMesh(hotelGeo, 0xc8b080, false);
        hotel.position.set(villX - 80, 13, villZ - 20);
        addMesh(hotel);

        // Hotel roof
        var hotelRoofGeo = new THREE.ConeGeometry(26, 14, 4);
        var hotelRoof = makeMesh(hotelRoofGeo, 0x3a2a1a, false);
        hotelRoof.position.set(villX - 80, 30, villZ - 20);
        hotelRoof.rotation.y = Math.PI / 4;
        addMesh(hotelRoof);

        // Hotel chimney stacks
        var chim1Geo = new THREE.BoxGeometry(4, 10, 4);
        var chim1 = makeMesh(chim1Geo, 0x8a6a4a, false);
        chim1.position.set(villX - 90, 38, villZ - 25);
        addMesh(chim1);

        var chim2Geo = new THREE.BoxGeometry(4, 10, 4);
        var chim2 = makeMesh(chim2Geo, 0x8a6a4a, false);
        chim2.position.set(villX - 70, 38, villZ - 15);
        addMesh(chim2);

        // Village cottages (row of 4)
        var c;
        for (c = 0; c < 4; c++) {
            var cottGeo = new THREE.BoxGeometry(16, 12, 14);
            var cott = makeMesh(cottGeo, 0xe0d0b0, false);
            cott.position.set(villX - 140 - c * 25, 8, villZ + 30);
            addMesh(cott);

            var cottRoofGeo = new THREE.ConeGeometry(12, 8, 4);
            var cottRoof = makeMesh(cottRoofGeo, 0x4a3a2a, false);
            cottRoof.position.set(villX - 140 - c * 25, 20, villZ + 30);
            cottRoof.rotation.y = Math.PI / 4;
            addMesh(cottRoof);

            // Chimneys
            var cChimGeo = new THREE.BoxGeometry(3, 6, 3);
            var cChim = makeMesh(cChimGeo, 0x7a5a3a, false);
            cChim.position.set(villX - 145 - c * 25, 26, villZ + 28);
            addMesh(cChim);
        }

        // Car park (flat grey area)
        var carParkGeo = new THREE.BoxGeometry(80, 1, 40);
        var carPark = makeMesh(carParkGeo, 0x4a4a4a, false);
        carPark.position.set(villX + 20, 1, villZ + 60);
        addMesh(carPark);

        // Village green / grass
        var greenGeo = new THREE.BoxGeometry(200, 1, 60);
        var green = makeMesh(greenGeo, 0x4a7a3a, false);
        green.position.set(villX - 60, 1, villZ + 20);
        addMesh(green);
    }

    function buildInverness() {
        // Inverness at north end of loch
        var invX = X_OFFSET - 100;
        var invZ = -2200;

        // River Ness (flows from loch through city)
        var riverGeo = new THREE.BoxGeometry(60, 2, 400);
        var river = makeMesh(riverGeo, 0x1a3050, false);
        river.position.set(invX, 1, invZ);
        addMesh(river);

        // River bank east
        var bankEGeo = new THREE.BoxGeometry(20, 3, 400);
        var bankE = makeMesh(bankEGeo, 0x5a7a3a, false);
        bankE.position.set(invX + 40, 1, invZ);
        addMesh(bankE);

        // River bank west
        var bankWGeo = new THREE.BoxGeometry(20, 3, 400);
        var bankW = makeMesh(bankWGeo, 0x5a7a3a, false);
        bankW.position.set(invX - 40, 1, invZ);
        addMesh(bankW);

        // Inverness Castle — red sandstone on cliff
        // Castle cliff
        var cliffGeo = new THREE.BoxGeometry(80, 30, 70);
        var cliff = makeMesh(cliffGeo, 0x7a5a3a, true);
        cliff.position.set(invX + 90, 15, invZ - 80);
        addMesh(cliff);

        // Castle main block (red sandstone)
        var castleGeo = new THREE.BoxGeometry(50, 30, 45);
        var castle = makeMesh(castleGeo, 0xc04030, true);
        castle.position.set(invX + 90, 48, invZ - 80);
        addMesh(castle);

        // Castle towers (round, red sandstone)
        var t;
        var towerPositions = [
            [invX + 70, invZ - 102],
            [invX + 110, invZ - 102],
            [invX + 70, invZ - 58],
            [invX + 110, invZ - 58]
        ];
        for (t = 0; t < towerPositions.length; t++) {
            var ctGeo = new THREE.CylinderGeometry(8, 9, 42, 7);
            var ct = makeMesh(ctGeo, 0xb83828, true);
            ct.position.set(towerPositions[t][0], 54, towerPositions[t][1]);
            addMesh(ct);

            // Tower cap
            var capGeo = new THREE.ConeGeometry(9, 12, 7);
            var cap = makeMesh(capGeo, 0x6a3020, true);
            cap.position.set(towerPositions[t][0], 78, towerPositions[t][1]);
            addMesh(cap);
        }

        // Castle gatehouse
        var gateGeo = new THREE.BoxGeometry(22, 20, 16);
        var gate = makeMesh(gateGeo, 0xb03828, true);
        gate.position.set(invX + 90, 42, invZ - 55);
        addMesh(gate);

        // Victorian City Hall
        var hallGeo = new THREE.BoxGeometry(55, 28, 40);
        var hall = makeMesh(hallGeo, 0xe8d8b0, false);
        hall.position.set(invX + 180, 16, invZ - 60);
        addMesh(hall);

        // City Hall clock tower
        var clockTowerGeo = new THREE.BoxGeometry(14, 50, 14);
        var clockTower = makeMesh(clockTowerGeo, 0xd8c8a0, false);
        clockTower.position.set(invX + 180, 43, invZ - 60);
        addMesh(clockTower);

        // Clock tower spire
        var spireGeo = new THREE.ConeGeometry(8, 20, 4);
        var spire = makeMesh(spireGeo, 0x4a3a2a, false);
        spire.position.set(invX + 180, 78, invZ - 60);
        spire.rotation.y = Math.PI / 4;
        addMesh(spire);

        // Cathedral across the river (west side)
        var cathedralGeo = new THREE.BoxGeometry(40, 30, 70);
        var cathedral = makeMesh(cathedralGeo, 0xd0c0a0, false);
        cathedral.position.set(invX - 110, 17, invZ - 100);
        addMesh(cathedral);

        // Cathedral twin towers
        var ctow1Geo = new THREE.BoxGeometry(12, 48, 12);
        var ctow1 = makeMesh(ctow1Geo, 0xc8b898, false);
        ctow1.position.set(invX - 125, 26, invZ - 132);
        addMesh(ctow1);

        var ctow2Geo = new THREE.BoxGeometry(12, 48, 12);
        var ctow2 = makeMesh(ctow2Geo, 0xc8b898, false);
        ctow2.position.set(invX - 95, 26, invZ - 132);
        addMesh(ctow2);

        // Cathedral spires
        var csp1Geo = new THREE.ConeGeometry(7, 18, 4);
        var csp1 = makeMesh(csp1Geo, 0x5a4a3a, false);
        csp1.position.set(invX - 125, 68, invZ - 132);
        csp1.rotation.y = Math.PI / 4;
        addMesh(csp1);

        var csp2Geo = new THREE.ConeGeometry(7, 18, 4);
        var csp2 = makeMesh(csp2Geo, 0x5a4a3a, false);
        csp2.position.set(invX - 95, 68, invZ - 132);
        csp2.rotation.y = Math.PI / 4;
        addMesh(csp2);

        // Cathedral nave roof
        var naveRoofGeo = new THREE.BoxGeometry(44, 6, 74);
        var naveRoof = makeMesh(naveRoofGeo, 0x6a5a4a, false);
        naveRoof.position.set(invX - 110, 35, invZ - 98);
        addMesh(naveRoof);

        // Bridge over River Ness
        var bridgeGeo = new THREE.BoxGeometry(80, 3, 12);
        var bridge = makeMesh(bridgeGeo, 0x888880, false);
        bridge.position.set(invX, 5, invZ - 80);
        addMesh(bridge);

        // Bridge railings
        var railNGeo = new THREE.BoxGeometry(80, 3, 1);
        var railN = makeMesh(railNGeo, 0x707068, false);
        railN.position.set(invX, 8, invZ - 86);
        addMesh(railN);

        var railSGeo = new THREE.BoxGeometry(80, 3, 1);
        var railS = makeMesh(railSGeo, 0x707068, false);
        railS.position.set(invX, 8, invZ - 74);
        addMesh(railS);

        // Bridge arch supports
        var arch1Geo = new THREE.CylinderGeometry(3, 4, 8, 6);
        var arch1 = makeMesh(arch1Geo, 0x888880, false);
        arch1.position.set(invX - 25, 1, invZ - 80);
        addMesh(arch1);

        var arch2Geo = new THREE.CylinderGeometry(3, 4, 8, 6);
        var arch2 = makeMesh(arch2Geo, 0x888880, false);
        arch2.position.set(invX + 25, 1, invZ - 80);
        addMesh(arch2);

        // City streets (main blocks)
        var st1Geo = new THREE.BoxGeometry(200, 1, 12);
        var st1 = makeMesh(st1Geo, 0x3a3a3a, false);
        st1.position.set(invX + 150, 1, invZ - 30);
        addMesh(st1);

        var st2Geo = new THREE.BoxGeometry(12, 1, 300);
        var st2 = makeMesh(st2Geo, 0x3a3a3a, false);
        st2.position.set(invX + 130, 1, invZ - 100);
        addMesh(st2);

        // City blocks — Victorian terraced buildings
        var ci;
        var cityBlocks = [
            [invX + 220, invZ - 50, 40, 18, 30, 0xd0c0a0],
            [invX + 260, invZ - 130, 35, 16, 25, 0xc8b898],
            [invX + 150, invZ - 140, 50, 20, 35, 0xd4c4a0],
            [invX + 200, invZ - 200, 45, 14, 30, 0xc0b090],
            [invX - 160, invZ - 50, 40, 16, 28, 0xc8c0a0],
            [invX - 160, invZ - 130, 35, 18, 25, 0xd0c8a8]
        ];
        for (ci = 0; ci < cityBlocks.length; ci++) {
            var cb = cityBlocks[ci];
            var cbGeo = new THREE.BoxGeometry(cb[2], cb[3], cb[4]);
            var cbMesh = makeMesh(cbGeo, cb[5], false);
            cbMesh.position.set(cb[0], cb[3] / 2, cb[1]);
            addMesh(cbMesh);

            // Simple flat roofs
            var cbRoofGeo = new THREE.BoxGeometry(cb[2] + 2, 3, cb[4] + 2);
            var cbRoof = makeMesh(cbRoofGeo, 0x5a4a3a, false);
            cbRoof.position.set(cb[0], cb[3] + 1.5, cb[1]);
            addMesh(cbRoof);
        }

        // Ground plane for city area
        var cityGroundGeo = new THREE.BoxGeometry(600, 1, 500);
        var cityGround = makeMesh(cityGroundGeo, 0x5a7a3a, false);
        cityGround.position.set(invX + 50, 0, invZ - 100);
        addMesh(cityGround);
    }

    function buildSurroundingLandscape() {
        // Base ground plane
        var groundGeo = new THREE.BoxGeometry(3000, 2, 6000);
        var ground = makeMesh(groundGeo, 0x3a5a2a, false);
        ground.position.set(X_OFFSET, -1, 0);
        addMesh(ground);

        // Highland moorland patches
        var m;
        var moorPatches = [
            [X_OFFSET + 700, 0, 200, 200, 800],
            [X_OFFSET - 700, 0, -400, 200, 600],
            [X_OFFSET + 600, 0, 1000, 150, 500],
            [X_OFFSET - 600, 0, 1500, 180, 600]
        ];
        for (m = 0; m < moorPatches.length; m++) {
            var mp = moorPatches[m];
            var moorGeo = new THREE.BoxGeometry(mp[3], 2, mp[4]);
            var moor = makeMesh(moorGeo, 0x6a7a3a, false);
            moor.position.set(mp[0], mp[1], mp[2]);
            addMesh(moor);
        }

        // Forest patches along hillsides
        var f;
        var forestPositions = [
            [X_OFFSET + 420, 20, 300, 120, 400],
            [X_OFFSET + 420, 20, -300, 100, 300],
            [X_OFFSET - 420, 20, 500, 120, 400],
            [X_OFFSET - 420, 20, -600, 100, 350],
            [X_OFFSET + 420, 20, 800, 110, 500],
            [X_OFFSET - 420, 20, 1200, 130, 450]
        ];
        for (f = 0; f < forestPositions.length; f++) {
            var fp = forestPositions[f];
            var forestGeo = new THREE.BoxGeometry(fp[3], 30, fp[4]);
            var forest = makeMesh(forestGeo, 0x1a3a10, false);
            forest.position.set(fp[0], fp[1], fp[2]);
            addMesh(forest);

            // Tree canopy bumps
            var treeGeo = new THREE.SphereGeometry(20, 6, 4);
            var tree = makeMesh(treeGeo, 0x1e4214, false);
            tree.position.set(fp[0], fp[1] + 25, fp[2]);
            addMesh(tree);
        }

        // Rocky outcrops on hillsides
        var r;
        var rockOutcrops = [
            [X_OFFSET + 500, 60, -100, 30, 20, 25],
            [X_OFFSET - 480, 55, 300, 25, 18, 22],
            [X_OFFSET + 520, 65, 700, 35, 22, 28],
            [X_OFFSET - 490, 58, -900, 28, 16, 20]
        ];
        for (r = 0; r < rockOutcrops.length; r++) {
            var ro = rockOutcrops[r];
            var roGeo = new THREE.BoxGeometry(ro[3], ro[4], ro[5]);
            var roMesh = makeMesh(roGeo, 0x5a5050, true);
            roMesh.position.set(ro[0], ro[1], ro[2]);
            addMesh(roMesh);
        }

        // South end loch narrowing
        var southLochGeo = new THREE.BoxGeometry(400, 2, 200);
        var southLoch = makeMesh(southLochGeo, 0x080e18, false);
        southLoch.position.set(X_OFFSET, -0.5, 2550);
        addMesh(southLoch);

        // North end loch opening
        var northLochGeo = new THREE.BoxGeometry(350, 2, 150);
        var northLoch = makeMesh(northLochGeo, 0x080e18, false);
        northLoch.position.set(X_OFFSET, -0.5, -2550);
        addMesh(northLoch);

        // Sky/atmosphere box for depth of highland scene
        var fogGeo = new THREE.BoxGeometry(2800, 200, 5800);
        var fog = makeMesh(fogGeo, 0x8090a8, false);
        fog.position.set(X_OFFSET, 160, 0);
        addMesh(fog);
    }

    function build() {
        buildLoch();
        buildUrquhartCastle();
        buildNessie();
        buildCaledonianCanal();
        buildDrumnadrochit();
        buildInverness();
        buildSurroundingLandscape();
    }

    function update(delta) {
        // Nessie gentle bob animation — objects[20..28] are nessie parts
        // Simple rotation of whole scene update not needed; reserved for future
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
