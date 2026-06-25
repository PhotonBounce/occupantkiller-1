window.PenzanceCauseway = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14320;

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

    function build() {
        buildMountsBay();
        buildStMichaelsMount();
        buildCauseway();
        buildPenzancePromenade();
        buildNewlyn();
        buildMousehole();
    }

    function buildMountsBay() {
        // Wide bay sea surface
        var seaGeo = new THREE.BoxGeometry(3000, 1, 4000);
        var sea = makeMesh(seaGeo, 0x1a6b8a);
        sea.position.set(X_OFFSET, -1, 0);
        addObj(sea);

        // Sandy beach strip - Penzance side
        var beach1Geo = new THREE.BoxGeometry(800, 0.5, 120);
        var beach1 = makeMesh(beach1Geo, 0xd4c89a);
        beach1.position.set(X_OFFSET + 200, 0.3, -900);
        addObj(beach1);

        // Sandy beach - further bay
        var beach2Geo = new THREE.BoxGeometry(600, 0.5, 80);
        var beach2 = makeMesh(beach2Geo, 0xd4c89a);
        beach2.position.set(X_OFFSET - 300, 0.3, -600);
        addObj(beach2);

        // Rocky headland west
        var headland1Geo = new THREE.BoxGeometry(200, 20, 150);
        var headland1 = makeMesh(headland1Geo, 0x7a7060);
        headland1.position.set(X_OFFSET - 1100, 10, 600);
        addObj(headland1);

        var headland1topGeo = new THREE.BoxGeometry(160, 12, 120);
        var headland1top = makeMesh(headland1topGeo, 0x6b6352);
        headland1top.position.set(X_OFFSET - 1100, 26, 600);
        addObj(headland1top);

        // Rocky headland east
        var headland2Geo = new THREE.BoxGeometry(180, 18, 130);
        var headland2 = makeMesh(headland2Geo, 0x7a7060);
        headland2.position.set(X_OFFSET + 900, 9, 500);
        addObj(headland2);

        // Offshore reefs
        var reef1Geo = new THREE.BoxGeometry(40, 3, 25);
        var reef1 = makeMesh(reef1Geo, 0x5a5545);
        reef1.position.set(X_OFFSET - 400, 0.5, 300);
        addObj(reef1);

        var reef2Geo = new THREE.BoxGeometry(30, 2, 20);
        var reef2 = makeMesh(reef2Geo, 0x5a5545);
        reef2.position.set(X_OFFSET - 200, 0.5, 500);
        addObj(reef2);

        var reef3Geo = new THREE.BoxGeometry(50, 4, 30);
        var reef3 = makeMesh(reef3Geo, 0x5a5545);
        reef3.position.set(X_OFFSET + 300, 0.5, 700);
        addObj(reef3);

        var reef4Geo = new THREE.BoxGeometry(25, 2, 18);
        var reef4 = makeMesh(reef4Geo, 0x5a5545);
        reef4.position.set(X_OFFSET + 100, 0.5, 900);
        addObj(reef4);
    }

    function buildStMichaelsMount() {
        // Island base - rocky granite rising from sea
        var islandBaseGeo = new THREE.CylinderGeometry(120, 160, 8, 8);
        var islandBase = makeMesh(islandBaseGeo, 0x8a7d6a);
        islandBase.position.set(X_OFFSET + 600, 4, 400);
        addObj(islandBase);

        // Island mid rocky section
        var islandMidGeo = new THREE.CylinderGeometry(90, 120, 20, 8);
        var islandMid = makeMesh(islandMidGeo, 0x7d7060);
        islandMid.position.set(X_OFFSET + 600, 18, 400);
        addObj(islandMid);

        // Island upper rocky peak
        var islandPeakGeo = new THREE.CylinderGeometry(50, 90, 30, 7);
        var islandPeak = makeMesh(islandPeakGeo, 0x706558);
        islandPeak.position.set(X_OFFSET + 600, 43, 400);
        addObj(islandPeak);

        // Castle/priory - square keep base
        var keepBaseGeo = new THREE.BoxGeometry(40, 35, 40);
        var keepBase = makeMesh(keepBaseGeo, 0x8a7d6a);
        keepBase.position.set(X_OFFSET + 600, 75, 400);
        addObj(keepBase);

        // Keep battlements top
        var keepTopGeo = new THREE.BoxGeometry(44, 6, 44);
        var keepTop = makeMesh(keepTopGeo, 0x7a6e5e);
        keepTop.position.set(X_OFFSET + 600, 95, 400);
        addObj(keepTop);

        // Keep merlons (battlements) - corners
        var merlonPositions = [
            [X_OFFSET + 582, 100, 382],
            [X_OFFSET + 618, 100, 382],
            [X_OFFSET + 582, 100, 418],
            [X_OFFSET + 618, 100, 418]
        ];
        for (var mi = 0; mi < merlonPositions.length; mi++) {
            var merlonGeo = new THREE.BoxGeometry(8, 8, 8);
            var merlon = makeMesh(merlonGeo, 0x8a7d6a);
            merlon.position.set(merlonPositions[mi][0], merlonPositions[mi][1], merlonPositions[mi][2]);
            addObj(merlon);
        }

        // Chapel tower - taller narrower
        var chapelTowerGeo = new THREE.BoxGeometry(18, 50, 18);
        var chapelTower = makeMesh(chapelTowerGeo, 0x9a8d7a);
        chapelTower.position.set(X_OFFSET + 620, 83, 380);
        addObj(chapelTower);

        // Chapel tower spire
        var chapelSpireGeo = new THREE.ConeGeometry(10, 18, 4);
        var chapelSpire = makeMesh(chapelSpireGeo, 0x6a5f50);
        chapelSpire.position.set(X_OFFSET + 620, 117, 380);
        addObj(chapelSpire);

        // Additional castle buildings connecting
        var castleWingGeo = new THREE.BoxGeometry(30, 22, 25);
        var castleWing = makeMesh(castleWingGeo, 0x8a7d6a);
        castleWing.position.set(X_OFFSET + 575, 69, 405);
        addObj(castleWing);

        var castleWing2Geo = new THREE.BoxGeometry(25, 20, 30);
        var castleWing2 = makeMesh(castleWing2Geo, 0x7d7060);
        castleWing2.position.set(X_OFFSET + 610, 68, 420);
        addObj(castleWing2);

        // Harbour at island base - granite quay
        var quayGeo = new THREE.BoxGeometry(80, 4, 20);
        var quay = makeMesh(quayGeo, 0x9a9080);
        quay.position.set(X_OFFSET + 555, 2, 320);
        addObj(quay);

        var quayWallGeo = new THREE.BoxGeometry(80, 8, 4);
        var quayWall = makeMesh(quayWallGeo, 0x8a8070);
        quayWall.position.set(X_OFFSET + 555, 6, 311);
        addObj(quayWall);

        // Harbour arm
        var harbourArmGeo = new THREE.BoxGeometry(4, 6, 50);
        var harbourArm = makeMesh(harbourArmGeo, 0x8a8070);
        harbourArm.position.set(X_OFFSET + 516, 5, 345);
        addObj(harbourArm);

        // Island village cottages on slope
        var cottageConfigs = [
            [X_OFFSET + 580, 32, 360, 10, 12, 10, 0xc8b89a],
            [X_OFFSET + 570, 28, 370, 9, 10, 9, 0xb8a88a],
            [X_OFFSET + 560, 24, 375, 8, 10, 8, 0xc0b090],
            [X_OFFSET + 590, 30, 355, 10, 11, 10, 0xbcac8c],
            [X_OFFSET + 600, 29, 362, 9, 10, 9, 0xc4b494]
        ];
        for (var ci = 0; ci < cottageConfigs.length; ci++) {
            var cc = cottageConfigs[ci];
            var cottageGeo = new THREE.BoxGeometry(cc[3], cc[4], cc[5]);
            var cottage = makeMesh(cottageGeo, cc[6]);
            cottage.position.set(cc[0], cc[1], cc[2]);
            addObj(cottage);

            var cottageRoofGeo = new THREE.ConeGeometry(cc[3] * 0.75, 5, 4);
            var cottageRoof = makeMesh(cottageRoofGeo, 0x5a3a2a);
            cottageRoof.rotation.y = Math.PI / 4;
            cottageRoof.position.set(cc[0], cc[1] + cc[4] / 2 + 2.5, cc[2]);
            addObj(cottageRoof);
        }
    }

    function buildCauseway() {
        // Granite causeway - 500m narrow walkway revealed at low tide
        // Runs from shore toward St Michael's Mount (z direction)
        var cauwayLength = 500;
        var causewaySegments = 25;
        var segLen = cauwayLength / causewaySegments;

        for (var si = 0; si < causewaySegments; si++) {
            var segGeo = new THREE.BoxGeometry(8, 1, segLen - 0.5);
            var seg = makeMesh(segGeo, 0x9a9080);
            seg.position.set(X_OFFSET + 560, 0.7, -100 + si * segLen + segLen / 2);
            addObj(seg);

            // Granite block texture strips on causeway
            if (si % 3 === 0) {
                var blockLineGeo = new THREE.BoxGeometry(8.2, 0.2, 0.5);
                var blockLine = makeMesh(blockLineGeo, 0x7a7060);
                blockLine.position.set(X_OFFSET + 560, 1.2, -100 + si * segLen);
                addObj(blockLine);
            }
        }

        // Bollards along causeway
        for (var bi = 0; bi < 20; bi++) {
            var bollardGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 6);
            var bollardLeft = makeMesh(bollardGeo, 0x4a4540);
            bollardLeft.position.set(X_OFFSET + 555, 1.5, -100 + bi * 26);
            addObj(bollardLeft);

            var bollardRight = makeMesh(bollardGeo.clone(), 0x4a4540);
            bollardRight.position.set(X_OFFSET + 565, 1.5, -100 + bi * 26);
            addObj(bollardRight);
        }

        // Tourist figures walking the causeway (sphere heads + cylinder bodies)
        var touristPositions = [
            [X_OFFSET + 560, 0, -80],
            [X_OFFSET + 560, 0, 0],
            [X_OFFSET + 560, 0, 80],
            [X_OFFSET + 560, 0, 160],
            [X_OFFSET + 560, 0, 240],
            [X_OFFSET + 560, 0, 320]
        ];
        for (var ti = 0; ti < touristPositions.length; ti++) {
            var tp = touristPositions[ti];
            var bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.6, 6);
            var body = makeMesh(bodyGeo, 0x3a6a9a);
            body.position.set(tp[0], tp[1] + 1.3, tp[2]);
            addObj(body);

            var headGeo = new THREE.SphereGeometry(0.4, 6, 6);
            var head = makeMesh(headGeo, 0xdaa870);
            head.position.set(tp[0], tp[1] + 2.5, tp[2]);
            addObj(head);
        }

        // Sandy bay floor on either side of causeway
        var bayFloorGeo = new THREE.BoxGeometry(400, 0.3, 500);
        var bayFloor = makeMesh(bayFloorGeo, 0xc8b880);
        bayFloor.position.set(X_OFFSET + 360, 0.2, 150);
        addObj(bayFloor);
    }

    function buildPenzancePromenade() {
        // Long Victorian promenade
        var promGeo = new THREE.BoxGeometry(600, 1, 18);
        var prom = makeMesh(promGeo, 0xb0a898);
        prom.position.set(X_OFFSET + 100, 0.5, -950);
        addObj(prom);

        // Promenade sea wall
        var seaWallGeo = new THREE.BoxGeometry(600, 4, 3);
        var seaWall = makeMesh(seaWallGeo, 0xa09888);
        seaWall.position.set(X_OFFSET + 100, 2, -940);
        addObj(seaWall);

        // Art Deco Lido - Jubilee Pool (circular/triangular pool)
        var lidoBaseGeo = new THREE.CylinderGeometry(45, 45, 2, 12);
        var lidoBase = makeMesh(lidoBaseGeo, 0xd0c8c0);
        lidoBase.position.set(X_OFFSET + 50, 1, -1000);
        addObj(lidoBase);

        // Pool water
        var poolGeo = new THREE.CylinderGeometry(38, 38, 0.5, 12);
        var pool = makeMesh(poolGeo, 0x2a8aaa);
        pool.position.set(X_OFFSET + 50, 2.5, -1000);
        addObj(pool);

        // Lido Art Deco walls
        var lidoWallGeo = new THREE.CylinderGeometry(45, 45, 5, 12, 1, true);
        var lidoWall = makeMesh(lidoWallGeo, 0xe8e0d8);
        lidoWall.position.set(X_OFFSET + 50, 3.5, -1000);
        addObj(lidoWall);

        // Lido changing room building
        var changingRoomGeo = new THREE.BoxGeometry(30, 8, 12);
        var changingRoom = makeMesh(changingRoomGeo, 0xe0d8d0);
        changingRoom.position.set(X_OFFSET + 50, 5, -1048);
        addObj(changingRoom);

        var changingRoofGeo = new THREE.BoxGeometry(32, 2, 14);
        var changingRoof = makeMesh(changingRoofGeo, 0xd0c8c0);
        changingRoof.position.set(X_OFFSET + 50, 10, -1048);
        addObj(changingRoof);

        // Shelter buildings along prom
        var shelterConfigs = [
            [X_OFFSET - 100, -960],
            [X_OFFSET + 200, -960],
            [X_OFFSET + 350, -960]
        ];
        for (var shi = 0; shi < shelterConfigs.length; shi++) {
            var sc = shelterConfigs[shi];
            var shelterGeo = new THREE.BoxGeometry(12, 4, 6);
            var shelter = makeMesh(shelterGeo, 0xd8d0c8);
            shelter.position.set(sc[0], 2.5, sc[1]);
            addObj(shelter);

            var shelterRoofGeo = new THREE.BoxGeometry(14, 1, 8);
            var shelterRoof = makeMesh(shelterRoofGeo, 0x8a7060);
            shelterRoof.position.set(sc[0], 5, sc[1]);
            addObj(shelterRoof);
        }

        // Benches along prom
        for (var bni = 0; bni < 12; bni++) {
            var benchGeo = new THREE.BoxGeometry(2.5, 0.4, 0.8);
            var bench = makeMesh(benchGeo, 0x5a4a30);
            bench.position.set(X_OFFSET - 200 + bni * 50, 1, -958);
            addObj(bench);

            var benchLegGeo = new THREE.BoxGeometry(2.5, 0.8, 0.2);
            var benchLeg = makeMesh(benchLegGeo, 0x4a3a20);
            benchLeg.position.set(X_OFFSET - 200 + bni * 50, 0.6, -958);
            addObj(benchLeg);
        }

        // War memorial - column with sphere
        var memorialBaseGeo = new THREE.BoxGeometry(5, 1, 5);
        var memorialBase = makeMesh(memorialBaseGeo, 0xd0c8b8);
        memorialBase.position.set(X_OFFSET + 300, 0.5, -965);
        addObj(memorialBase);

        var memorialColumnGeo = new THREE.CylinderGeometry(0.8, 1, 14, 8);
        var memorialColumn = makeMesh(memorialColumnGeo, 0xd8d0c0);
        memorialColumn.position.set(X_OFFSET + 300, 8, -965);
        addObj(memorialColumn);

        var memorialTopGeo = new THREE.SphereGeometry(1.5, 8, 8);
        var memorialTop = makeMesh(memorialTopGeo, 0xc8c0b0);
        memorialTop.position.set(X_OFFSET + 300, 16, -965);
        addObj(memorialTop);

        // Lamp posts along prom
        for (var lpi = 0; lpi < 15; lpi++) {
            var lampPostGeo = new THREE.CylinderGeometry(0.15, 0.2, 5, 5);
            var lampPost = makeMesh(lampPostGeo, 0x2a2a2a);
            lampPost.position.set(X_OFFSET - 220 + lpi * 45, 2.5, -952);
            addObj(lampPost);

            var lampGeo = new THREE.SphereGeometry(0.4, 5, 5);
            var lamp = makeMesh(lampGeo, 0xffffaa);
            lamp.position.set(X_OFFSET - 220 + lpi * 45, 5.5, -952);
            addObj(lamp);
        }

        // Town buildings behind prom
        var townBldgWidths = [25, 20, 30, 22, 28, 18, 24];
        var townBldgHeights = [18, 22, 15, 20, 17, 25, 19];
        var townBldgColors = [0xc8a878, 0xd4b484, 0xc0a070, 0xd8b888, 0xc4ac7c, 0xbca070, 0xd0b07a];
        for (var tbi = 0; tbi < townBldgWidths.length; tbi++) {
            var tbGeo = new THREE.BoxGeometry(townBldgWidths[tbi], townBldgHeights[tbi], 20);
            var tb = makeMesh(tbGeo, townBldgColors[tbi]);
            tb.position.set(X_OFFSET - 230 + tbi * 75, townBldgHeights[tbi] / 2, -985);
            addObj(tb);
        }
    }

    function buildNewlyn() {
        // Newlyn fishing village - working harbour
        // Harbour walls
        var newlynX = X_OFFSET - 400;
        var newlynZ = -1100;

        var nHarbourFloorGeo = new THREE.BoxGeometry(200, 1, 150);
        var nHarbourFloor = makeMesh(nHarbourFloorGeo, 0x9a9080);
        nHarbourFloor.position.set(newlynX, 0.5, newlynZ);
        addObj(nHarbourFloor);

        // Harbour water
        var nWaterGeo = new THREE.BoxGeometry(160, 0.5, 120);
        var nWater = makeMesh(nWaterGeo, 0x1a5a78);
        nWater.position.set(newlynX, 0.8, newlynZ);
        addObj(nWater);

        // Main harbour wall north
        var nWallNorthGeo = new THREE.BoxGeometry(200, 5, 6);
        var nWallNorth = makeMesh(nWallNorthGeo, 0x8a8070);
        nWallNorth.position.set(newlynX, 2.5, newlynZ - 78);
        addObj(nWallNorth);

        // Main harbour wall south/pier
        var nPierGeo = new THREE.BoxGeometry(180, 4, 8);
        var nPier = makeMesh(nPierGeo, 0x9a9080);
        nPier.position.set(newlynX - 10, 2, newlynZ + 75);
        addObj(nPier);

        // Pier end arm
        var nPierEndGeo = new THREE.BoxGeometry(8, 4, 60);
        var nPierEnd = makeMesh(nPierEndGeo, 0x8a8070);
        nPierEnd.position.set(newlynX + 96, 2, newlynZ + 45);
        addObj(nPierEnd);

        // Fish market hall
        var fishMarketGeo = new THREE.BoxGeometry(60, 10, 25);
        var fishMarket = makeMesh(fishMarketGeo, 0xd0c8b8);
        fishMarket.position.set(newlynX - 50, 5, newlynZ - 50);
        addObj(fishMarket);

        var fishMarketRoofGeo = new THREE.BoxGeometry(62, 3, 27);
        var fishMarketRoof = makeMesh(fishMarketRoofGeo, 0x706050);
        fishMarketRoof.position.set(newlynX - 50, 11.5, newlynZ - 50);
        addObj(fishMarketRoof);

        // Fish market loading dock
        var dockGeo = new THREE.BoxGeometry(60, 1.5, 10);
        var dock = makeMesh(dockGeo, 0xb0a890);
        dock.position.set(newlynX - 50, 1.5, newlynZ - 28);
        addObj(dock);

        // Colourful fishing boats in harbour
        var boatColors = [0xd44444, 0x4488dd, 0x44aa44, 0xddaa22, 0x884422, 0x6644aa];
        var boatZPositions = [-1110, -1100, -1090, -1115, -1105, -1095];
        var boatXPositions = [newlynX - 60, newlynX - 30, newlynX, newlynX + 30, newlynX + 60, newlynX - 60];
        for (var fbi = 0; fbi < boatColors.length; fbi++) {
            var boatHullGeo = new THREE.BoxGeometry(6, 2.5, 14);
            var boatHull = makeMesh(boatHullGeo, boatColors[fbi]);
            boatHull.position.set(boatXPositions[fbi], 1.5, boatZPositions[fbi]);
            addObj(boatHull);

            var boatCabinGeo = new THREE.BoxGeometry(4, 3, 5);
            var boatCabin = makeMesh(boatCabinGeo, 0xe8dcc8);
            boatCabin.position.set(boatXPositions[fbi], 4, boatZPositions[fbi] - 2);
            addObj(boatCabin);

            var boatMastGeo = new THREE.CylinderGeometry(0.15, 0.2, 10, 4);
            var boatMast = makeMesh(boatMastGeo, 0x8a6a40);
            boatMast.position.set(boatXPositions[fbi], 7.5, boatZPositions[fbi]);
            addObj(boatMast);
        }

        // Net sheds
        var netShedConfigs = [
            [newlynX + 70, newlynZ - 55, 20, 8, 12],
            [newlynX + 95, newlynZ - 55, 20, 7, 12],
            [newlynX + 70, newlynZ - 72, 18, 7, 10]
        ];
        for (var nsi = 0; nsi < netShedConfigs.length; nsi++) {
            var ns = netShedConfigs[nsi];
            var shedGeo = new THREE.BoxGeometry(ns[2], ns[3], ns[4]);
            var shed = makeMesh(shedGeo, 0x5a5040);
            shed.position.set(ns[0], ns[3] / 2, ns[1]);
            addObj(shed);

            var shedRoofGeo = new THREE.ConeGeometry(ns[2] * 0.75, 4, 4);
            var shedRoof = makeMesh(shedRoofGeo, 0x3a3028);
            shedRoof.rotation.y = Math.PI / 4;
            shedRoof.position.set(ns[0], ns[3] + 2, ns[1]);
            addObj(shedRoof);
        }

        // Newlyn Art Gallery
        var galleryGeo = new THREE.BoxGeometry(30, 14, 20);
        var gallery = makeMesh(galleryGeo, 0xe8e0d0);
        gallery.position.set(newlynX + 50, 7, newlynZ - 80);
        addObj(gallery);

        var galleryRoofGeo = new THREE.BoxGeometry(32, 2, 22);
        var galleryRoof = makeMesh(galleryRoofGeo, 0xb0a898);
        galleryRoof.position.set(newlynX + 50, 15, newlynZ - 80);
        addObj(galleryRoof);

        var galleryFrontGeo = new THREE.BoxGeometry(30, 14, 2);
        var galleryFront = makeMesh(galleryFrontGeo, 0xd8d0c0);
        galleryFront.position.set(newlynX + 50, 7, newlynZ - 69);
        addObj(galleryFront);

        // Village cottages behind harbour
        var villageColors = [0xc8a878, 0xaac898, 0xd4b890, 0xc0a8c0, 0xd8c88a, 0xb8c8a8];
        for (var vci = 0; vci < villageColors.length; vci++) {
            var vcGeo = new THREE.BoxGeometry(10, 10, 9);
            var vc = makeMesh(vcGeo, villageColors[vci]);
            vc.position.set(newlynX - 80 + vci * 18, 5, newlynZ - 95);
            addObj(vc);

            var vcRoofGeo = new THREE.ConeGeometry(7, 6, 4);
            var vcRoof = makeMesh(vcRoofGeo, 0x5a3020);
            vcRoof.rotation.y = Math.PI / 4;
            vcRoof.position.set(newlynX - 80 + vci * 18, 13, newlynZ - 95);
            addObj(vcRoof);
        }
    }

    function buildMousehole() {
        // Mousehole - picturesque tiny harbour
        var mouseX = X_OFFSET - 800;
        var mouseZ = -1300;

        // Harbour water
        var mWaterGeo = new THREE.BoxGeometry(100, 0.5, 100);
        var mWater = makeMesh(mWaterGeo, 0x1a5a78);
        mWater.position.set(mouseX, 0.8, mouseZ);
        addObj(mWater);

        // Harbour floor/quay
        var mQuayGeo = new THREE.BoxGeometry(120, 1, 120);
        var mQuay = makeMesh(mQuayGeo, 0x9a8e7a);
        mQuay.position.set(mouseX, 0.5, mouseZ);
        addObj(mQuay);

        // Curved stone pier north arm
        var pierNorthCurveSegments = [
            [mouseX - 30, mouseZ - 55, 55, 3],
            [mouseX - 5, mouseZ - 58, 55, 3],
            [mouseX + 20, mouseZ - 55, 55, 3],
            [mouseX + 42, mouseZ - 48, 55, 3],
            [mouseX + 55, mouseZ - 30, 55, 3]
        ];
        for (var pni = 0; pni < pierNorthCurveSegments.length; pni++) {
            var pns = pierNorthCurveSegments[pni];
            var pnGeo = new THREE.BoxGeometry(18, 4, 6);
            var pnMesh = makeMesh(pnGeo, 0x8a8070);
            pnMesh.position.set(pns[0], 2, pns[1]);
            addObj(pnMesh);
        }

        // South curved pier arm
        var pierSouthCurveSegments = [
            [mouseX - 30, mouseZ + 55, 55, 3],
            [mouseX - 5, mouseZ + 58, 55, 3],
            [mouseX + 20, mouseZ + 55, 55, 3],
            [mouseX + 42, mouseZ + 48, 55, 3],
            [mouseX + 55, mouseZ + 30, 55, 3]
        ];
        for (var psi = 0; psi < pierSouthCurveSegments.length; psi++) {
            var pss = pierSouthCurveSegments[psi];
            var psGeo = new THREE.BoxGeometry(18, 4, 6);
            var psMesh = makeMesh(psGeo, 0x8a8070);
            psMesh.position.set(pss[0], 2, pss[1]);
            addObj(psMesh);
        }

        // Mousehole village cottages - pastel colours
        var pastelColors = [0xf0d0b0, 0xc0d8c0, 0xd0c0e0, 0xf0e0c0, 0xc0d0e8, 0xe8c8c0, 0xd8e8c0, 0xe8d8b0, 0xb8d0d8, 0xd8c8e8];
        for (var mci = 0; mci < pastelColors.length; mci++) {
            var mcGeo = new THREE.BoxGeometry(8, 9, 7);
            var mc = makeMesh(mcGeo, pastelColors[mci]);
            var mcX = mouseX - 50 + (mci % 5) * 20;
            var mcZ = mouseZ - 30 - Math.floor(mci / 5) * 20;
            mc.position.set(mcX, 4.5, mcZ);
            addObj(mc);

            var mcRoofGeo = new THREE.ConeGeometry(6, 5, 4);
            var mcRoof = makeMesh(mcRoofGeo, 0x604030);
            mcRoof.rotation.y = Math.PI / 4;
            mcRoof.position.set(mcX, 11.5, mcZ);
            addObj(mcRoof);

            var mcChimneyGeo = new THREE.CylinderGeometry(0.4, 0.4, 3, 4);
            var mcChimney = makeMesh(mcChimneyGeo, 0x705040);
            mcChimney.position.set(mcX + 2, 14.5, mcZ);
            addObj(mcChimney);
        }

        // Small fishing boats in harbour
        var mBoatColors = [0xcc3333, 0x3355cc, 0x339933];
        for (var mfbi = 0; mfbi < mBoatColors.length; mfbi++) {
            var mBoatGeo = new THREE.BoxGeometry(4, 2, 10);
            var mBoat = makeMesh(mBoatGeo, mBoatColors[mfbi]);
            mBoat.position.set(mouseX - 20 + mfbi * 20, 1.5, mouseZ - 10 + mfbi * 10);
            addObj(mBoat);

            var mBoatCabinGeo = new THREE.BoxGeometry(3, 2, 3);
            var mBoatCabin = makeMesh(mBoatCabinGeo, 0xe0d8c8);
            mBoatCabin.position.set(mouseX - 20 + mfbi * 20, 3.5, mouseZ - 12 + mfbi * 10);
            addObj(mBoatCabin);
        }

        // Christmas lights - LineSegments strung across harbour
        var lightPositions = [];
        var numLightStrings = 8;
        for (var ls = 0; ls < numLightStrings; ls++) {
            var startX = mouseX - 40;
            var endX = mouseX + 40;
            var lZ = mouseZ - 40 + ls * 12;
            var numPts = 10;
            for (var lp = 0; lp < numPts - 1; lp++) {
                var t0 = lp / (numPts - 1);
                var t1 = (lp + 1) / (numPts - 1);
                var x0 = startX + t0 * (endX - startX);
                var x1 = startX + t1 * (endX - startX);
                var sag0 = Math.sin(t0 * Math.PI) * 2;
                var sag1 = Math.sin(t1 * Math.PI) * 2;
                lightPositions.push(x0, 8 - sag0, lZ);
                lightPositions.push(x1, 8 - sag1, lZ);
            }
        }

        var lightGeoBuffer = new THREE.BufferGeometry();
        lightGeoBuffer.setAttribute('position', new THREE.Float32BufferAttribute(lightPositions, 3));
        var lightMat = new THREE.LineBasicMaterial({ color: 0xffff44 });
        var lightLines = new THREE.LineSegments(lightGeoBuffer, lightMat);
        scene.add(lightLines);
        objects.push(lightLines);

        // Light bulb spheres on strings
        for (var lb = 0; lb < numLightStrings; lb++) {
            var lbZ = mouseZ - 40 + lb * 12;
            for (var lbp = 0; lbp < 6; lbp++) {
                var lbT = (lbp + 1) / 7;
                var lbX = (mouseX - 40) + lbT * 80;
                var lbSag = Math.sin(lbT * Math.PI) * 2;
                var lbColors = [0xff2222, 0x22ff22, 0x2222ff, 0xffff22, 0xff22ff, 0x22ffff];
                var bulbGeo = new THREE.SphereGeometry(0.25, 4, 4);
                var bulb = makeMesh(bulbGeo, lbColors[lbp % lbColors.length]);
                bulb.position.set(lbX, 8 - lbSag - 0.4, lbZ);
                addObj(bulb);
            }
        }

        // Pub/inn at harbour
        var pubGeo = new THREE.BoxGeometry(14, 12, 10);
        var pub = makeMesh(pubGeo, 0xd4b888);
        pub.position.set(mouseX - 45, 6, mouseZ + 10);
        addObj(pub);

        var pubRoofGeo = new THREE.ConeGeometry(10, 6, 4);
        var pubRoof = makeMesh(pubRoofGeo, 0x5a3a20);
        pubRoof.rotation.y = Math.PI / 4;
        pubRoof.position.set(mouseX - 45, 15, mouseZ + 10);
        addObj(pubRoof);

        var pubSignGeo = new THREE.BoxGeometry(5, 3, 0.3);
        var pubSign = makeMesh(pubSignGeo, 0x8a3a10);
        pubSign.position.set(mouseX - 38, 8, mouseZ + 5.5);
        addObj(pubSign);
    }

    function update(delta) {
        // Future: animate causeway tourists, boat bobs, tide etc.
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
