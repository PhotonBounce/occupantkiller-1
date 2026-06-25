window.ArundelWestSussex = (function() {
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

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geometry, color) {
        return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: color }));
    }

    function build() {
        buildHilltopMound();
        buildArundelCastle();
        buildArundelCathedral();
        buildRiverArun();
        buildTownStreets();
    }

    function buildHilltopMound() {
        // Stacked BoxGeometry steps forming the Norman motte mound
        var ox = 10320;
        var stepData = [
            { w: 80, h: 4,  d: 80,  x: ox,       y: 2,   z: -200 },
            { w: 70, h: 5,  d: 70,  x: ox,       y: 7.5, z: -200 },
            { w: 60, h: 5,  d: 60,  x: ox,       y: 13,  z: -200 },
            { w: 50, h: 5,  d: 50,  x: ox,       y: 18,  z: -200 },
            { w: 42, h: 4,  d: 42,  x: ox,       y: 23,  z: -200 },
            { w: 36, h: 4,  d: 36,  x: ox,       y: 28,  z: -200 },
            { w: 30, h: 3,  d: 30,  x: ox,       y: 32,  z: -200 }
        ];
        for (var i = 0; i < stepData.length; i++) {
            var s = stepData[i];
            var mesh = makeMesh(new THREE.BoxGeometry(s.w, s.h, s.d), 0x6b7c52);
            mesh.position.set(s.x, s.y, s.z);
            addMesh(mesh);
        }
        // Bailey slope connecting mound to lower courtyard
        var baileySlope = makeMesh(new THREE.BoxGeometry(50, 10, 30), 0x7a8b60);
        baileySlope.position.set(10320, 10, -165);
        addMesh(baileySlope);
    }

    function buildArundelCastle() {
        var ox = 10320;
        var baseY = 34; // top of mound
        var mz = -200;  // mound centre z

        // --- Round Keep Tower (Norman shell keep) ---
        var keep = makeMesh(new THREE.CylinderGeometry(12, 13, 20, 16), 0x9e9070);
        keep.position.set(ox, baseY + 10, mz);
        addMesh(keep);

        // Keep roof cone
        var keepRoof = makeMesh(new THREE.ConeGeometry(12.5, 6, 16), 0x6a5a3a);
        keepRoof.position.set(ox, baseY + 23, mz);
        addMesh(keepRoof);

        // Keep inner walkway ring (thin cylinder)
        var keepWalk = makeMesh(new THREE.CylinderGeometry(13.5, 13.5, 2, 16), 0x8a7a60);
        keepWalk.position.set(ox, baseY + 20, mz);
        addMesh(keepWalk);

        // --- Curtain Walls (four sides of main ward) ---
        // North wall
        var wallN = makeMesh(new THREE.BoxGeometry(70, 8, 3), 0x9e9070);
        wallN.position.set(ox, baseY + 4, mz - 32);
        addMesh(wallN);

        // South wall
        var wallS = makeMesh(new THREE.BoxGeometry(70, 8, 3), 0x9e9070);
        wallS.position.set(ox, baseY + 4, mz + 32);
        addMesh(wallS);

        // East wall
        var wallE = makeMesh(new THREE.BoxGeometry(3, 8, 64), 0x9e9070);
        wallE.position.set(ox + 35, baseY + 4, mz);
        addMesh(wallE);

        // West wall
        var wallW = makeMesh(new THREE.BoxGeometry(3, 8, 64), 0x9e9070);
        wallW.position.set(ox - 35, baseY + 4, mz);
        addMesh(wallW);

        // --- Corner Towers ---
        var cornerPositions = [
            { x: ox + 35, z: mz - 32 },
            { x: ox - 35, z: mz - 32 },
            { x: ox + 35, z: mz + 32 },
            { x: ox - 35, z: mz + 32 }
        ];
        for (var i = 0; i < cornerPositions.length; i++) {
            var cp = cornerPositions[i];
            var ct = makeMesh(new THREE.CylinderGeometry(4, 4.5, 12, 8), 0x9e9070);
            ct.position.set(cp.x, baseY + 6, cp.z);
            addMesh(ct);
            var ctRoof = makeMesh(new THREE.ConeGeometry(4.5, 4, 8), 0x6a5a3a);
            ctRoof.position.set(cp.x, baseY + 14, cp.z);
            addMesh(ctRoof);
        }

        // --- Barbican Gatehouse ---
        // Two flanking towers
        var gateL = makeMesh(new THREE.BoxGeometry(6, 14, 6), 0x8a7a60);
        gateL.position.set(ox - 6, baseY + 7, mz + 36);
        addMesh(gateL);

        var gateR = makeMesh(new THREE.BoxGeometry(6, 14, 6), 0x8a7a60);
        gateR.position.set(ox + 6, baseY + 7, mz + 36);
        addMesh(gateR);

        // Gate arch lintel
        var gateTop = makeMesh(new THREE.BoxGeometry(12, 3, 5), 0x8a7a60);
        gateTop.position.set(ox, baseY + 14.5, mz + 36);
        addMesh(gateTop);

        // Gate roof caps
        var gateRoofL = makeMesh(new THREE.ConeGeometry(4, 4, 4), 0x6a5a3a);
        gateRoofL.position.set(ox - 6, baseY + 18, mz + 36);
        addMesh(gateRoofL);

        var gateRoofR = makeMesh(new THREE.ConeGeometry(4, 4, 4), 0x6a5a3a);
        gateRoofR.position.set(ox + 6, baseY + 18, mz + 36);
        addMesh(gateRoofR);

        // --- Bailey lower ward walls ---
        var baileyWallN = makeMesh(new THREE.BoxGeometry(60, 6, 2), 0x9e9070);
        baileyWallN.position.set(ox, 14, mz + 50);
        addMesh(baileyWallN);

        var baileyWallE = makeMesh(new THREE.BoxGeometry(2, 6, 40), 0x9e9070);
        baileyWallE.position.set(ox + 30, 14, mz + 70);
        addMesh(baileyWallE);

        var baileyWallW = makeMesh(new THREE.BoxGeometry(2, 6, 40), 0x9e9070);
        baileyWallW.position.set(ox - 30, 14, mz + 70);
        addMesh(baileyWallW);

        // Lower bailey gatehouse
        var lbgL = makeMesh(new THREE.BoxGeometry(5, 10, 5), 0x8a7a60);
        lbgL.position.set(ox - 5, 10, mz + 90);
        addMesh(lbgL);

        var lbgR = makeMesh(new THREE.BoxGeometry(5, 10, 5), 0x8a7a60);
        lbgR.position.set(ox + 5, 10, mz + 90);
        addMesh(lbgR);

        var lbgTop = makeMesh(new THREE.BoxGeometry(10, 3, 4), 0x8a7a60);
        lbgTop.position.set(ox, 16.5, mz + 90);
        addMesh(lbgTop);

        // Castle ground platform
        var castleBase = makeMesh(new THREE.BoxGeometry(80, 2, 80), 0x7a7060);
        castleBase.position.set(ox, baseY + 1, mz);
        addMesh(castleBase);

        // Merlon battlements on north wall
        for (var m = -3; m <= 3; m++) {
            var merlon = makeMesh(new THREE.BoxGeometry(3, 3, 2), 0x9e9070);
            merlon.position.set(ox + m * 9, baseY + 10, mz - 32);
            addMesh(merlon);
        }
    }

    function buildArundelCathedral() {
        // Arundel Cathedral — Victorian Gothic RC Cathedral
        // Positioned south-east of castle on lower ground
        var ox = 10320 + 100;
        var oz = -80;
        var by = 1; // ground level

        // Main nave body
        var nave = makeMesh(new THREE.BoxGeometry(24, 18, 60), 0xc0b090);
        nave.position.set(ox, by + 9, oz);
        addMesh(nave);

        // Nave roof ridge
        var naveRoof = makeMesh(new THREE.BoxGeometry(6, 8, 62), 0x8a7060);
        naveRoof.rotation.z = Math.PI / 6;
        naveRoof.position.set(ox, by + 22, oz);
        addMesh(naveRoof);

        // Chancel (east end)
        var chancel = makeMesh(new THREE.BoxGeometry(20, 14, 20), 0xc0b090);
        chancel.position.set(ox, by + 7, oz - 38);
        addMesh(chancel);

        var chancelRoof = makeMesh(new THREE.BoxGeometry(5, 6, 22), 0x8a7060);
        chancelRoof.rotation.z = Math.PI / 6;
        chancelRoof.position.set(ox, by + 17, oz - 38);
        addMesh(chancelRoof);

        // Transept arms
        var transeptL = makeMesh(new THREE.BoxGeometry(16, 14, 18), 0xc0b090);
        transeptL.position.set(ox - 20, by + 7, oz - 10);
        addMesh(transeptL);

        var transeptR = makeMesh(new THREE.BoxGeometry(16, 14, 18), 0xc0b090);
        transeptR.position.set(ox + 20, by + 7, oz - 10);
        addMesh(transeptR);

        // --- Twin Spire Towers (west front) ---
        // Left tower
        var towerL = makeMesh(new THREE.BoxGeometry(10, 40, 10), 0xb8a880);
        towerL.position.set(ox - 9, by + 20, oz + 32);
        addMesh(towerL);

        var spireL = makeMesh(new THREE.ConeGeometry(5, 20, 4), 0x7a6a50);
        spireL.position.set(ox - 9, by + 50, oz + 32);
        addMesh(spireL);

        // Right tower
        var towerR = makeMesh(new THREE.BoxGeometry(10, 40, 10), 0xb8a880);
        towerR.position.set(ox + 9, by + 20, oz + 32);
        addMesh(towerR);

        var spireR = makeMesh(new THREE.ConeGeometry(5, 20, 4), 0x7a6a50);
        spireR.position.set(ox + 9, by + 50, oz + 32);
        addMesh(spireR);

        // West front portal wall between towers
        var westFront = makeMesh(new THREE.BoxGeometry(8, 30, 3), 0xc0b090);
        westFront.position.set(ox, by + 15, oz + 32);
        addMesh(westFront);

        // Rose window circle (sphere flattened)
        var roseWindow = makeMesh(new THREE.SphereGeometry(3.5, 8, 8), 0x4a6a9a);
        roseWindow.scale.z = 0.2;
        roseWindow.position.set(ox, by + 24, oz + 34);
        addMesh(roseWindow);

        // --- Flying Buttresses ---
        var buttressData = [
            { x: ox - 14, z: oz - 20 },
            { x: ox - 14, z: oz },
            { x: ox - 14, z: oz + 10 },
            { x: ox + 14, z: oz - 20 },
            { x: ox + 14, z: oz },
            { x: ox + 14, z: oz + 10 }
        ];
        for (var b = 0; b < buttressData.length; b++) {
            var bd = buttressData[b];
            var butt = makeMesh(new THREE.BoxGeometry(3, 12, 3), 0xb0a070);
            butt.position.set(bd.x, by + 6, bd.z);
            addMesh(butt);

            // Angled buttress arm
            var arm = makeMesh(new THREE.BoxGeometry(2, 2, 8), 0xb0a070);
            arm.rotation.x = Math.PI / 8;
            var armOffX = (bd.x < ox) ? 5 : -5;
            arm.position.set(bd.x + armOffX * 0.5, by + 14, bd.z);
            addMesh(arm);
        }

        // Porch entrance
        var porch = makeMesh(new THREE.BoxGeometry(10, 8, 6), 0xb8a880);
        porch.position.set(ox, by + 4, oz + 36);
        addMesh(porch);

        var porchRoof = makeMesh(new THREE.ConeGeometry(6, 4, 4), 0x8a7060);
        porchRoof.position.set(ox, by + 10, oz + 36);
        addMesh(porchRoof);
    }

    function buildRiverArun() {
        // River Arun runs roughly north-south through town
        // x-offset ~10320, river slightly west at x ~ 10280
        var rx = 10280;

        // River surface — blue flat boxes
        var riverSegments = [
            { z: 100,   l: 60 },
            { z: 50,    l: 60 },
            { z: 0,     l: 60 },
            { z: -50,   l: 60 },
            { z: -100,  l: 60 },
            { z: -150,  l: 60 },
            { z: -200,  l: 60 },
            { z: -250,  l: 60 },
            { z: -300,  l: 60 }
        ];
        for (var i = 0; i < riverSegments.length; i++) {
            var rs = riverSegments[i];
            var river = makeMesh(new THREE.BoxGeometry(18, 0.4, rs.l), 0x2a6a9a);
            river.position.set(rx, 0.2, rs.z);
            addMesh(river);
        }

        // Stone quay walls on east bank
        var quayData = [
            { z: 50 }, { z: 0 }, { z: -50 }, { z: -100 }, { z: -150 }
        ];
        for (var q = 0; q < quayData.length; q++) {
            var qz = quayData[q].z;
            var quayWall = makeMesh(new THREE.BoxGeometry(3, 3, 48), 0x7a7060);
            quayWall.position.set(rx + 10, 1.5, qz);
            addMesh(quayWall);
        }

        // Quay buildings — riverside warehouses
        var warehouseData = [
            { x: rx + 20, z: 60 },
            { x: rx + 20, z: 10 },
            { x: rx + 20, z: -40 },
            { x: rx + 20, z: -90 },
            { x: rx + 20, z: -140 }
        ];
        for (var w = 0; w < warehouseData.length; w++) {
            var wd = warehouseData[w];
            var whouse = makeMesh(new THREE.BoxGeometry(12, 8, 16), 0x8a7060);
            whouse.position.set(wd.x, 4, wd.z);
            addMesh(whouse);
            var wroof = makeMesh(new THREE.BoxGeometry(13, 3, 17), 0x5a4a38);
            wroof.position.set(wd.x, 9.5, wd.z);
            addMesh(wroof);
        }

        // West bank — flood plain
        var floodPlain = makeMesh(new THREE.BoxGeometry(30, 0.5, 560), 0x5a7040);
        floodPlain.position.set(rx - 20, 0.1, -100);
        addMesh(floodPlain);

        // Stone bridge across river
        var bridgeDeck = makeMesh(new THREE.BoxGeometry(20, 1.5, 8), 0x9a8a70);
        bridgeDeck.position.set(rx, 2.5, -30);
        addMesh(bridgeDeck);

        var bridgePierL = makeMesh(new THREE.CylinderGeometry(1.5, 2, 5, 6), 0x8a7a60);
        bridgePierL.position.set(rx - 5, 1.5, -30);
        addMesh(bridgePierL);

        var bridgePierR = makeMesh(new THREE.CylinderGeometry(1.5, 2, 5, 6), 0x8a7a60);
        bridgePierR.position.set(rx + 5, 1.5, -30);
        addMesh(bridgePierR);

        // Bridge railings
        var railL = makeMesh(new THREE.BoxGeometry(1, 2, 8), 0x7a6a50);
        railL.position.set(rx - 9, 3.5, -30);
        addMesh(railL);

        var railR = makeMesh(new THREE.BoxGeometry(1, 2, 8), 0x7a6a50);
        railR.position.set(rx + 9, 3.5, -30);
        addMesh(railR);
    }

    function buildTownStreets() {
        // Steep main street running south from castle hill
        // Flint-stone Victorian terraces either side
        var ox = 10320;

        // Ground plane for town
        var ground = makeMesh(new THREE.BoxGeometry(200, 0.5, 400), 0x5a5a40);
        ground.position.set(ox, -0.25, 50);
        addMesh(ground);

        // Main street surface
        var mainStreet = makeMesh(new THREE.BoxGeometry(10, 0.6, 300), 0x6a6a5a);
        mainStreet.position.set(ox, 0.3, 0);
        addMesh(mainStreet);

        // East terrace — Victorian flint buildings
        var eastTerraceData = [
            { z: -80,  w: 12, h: 10, d: 10 },
            { z: -60,  w: 12, h: 11, d: 10 },
            { z: -40,  w: 12, h: 10, d: 10 },
            { z: -20,  w: 14, h: 9,  d: 10 },
            { z: 0,    w: 12, h: 10, d: 10 },
            { z: 20,   w: 12, h: 11, d: 10 },
            { z: 40,   w: 14, h: 9,  d: 10 },
            { z: 60,   w: 12, h: 10, d: 10 },
            { z: 80,   w: 12, h: 11, d: 10 },
            { z: 100,  w: 14, h: 10, d: 10 },
            { z: 120,  w: 12, h: 9,  d: 10 },
            { z: 140,  w: 12, h: 10, d: 10 }
        ];
        for (var e = 0; e < eastTerraceData.length; e++) {
            var et = eastTerraceData[e];
            var ewall = makeMesh(new THREE.BoxGeometry(et.w, et.h, et.d), 0x7a7060);
            ewall.position.set(ox + 16, et.h / 2, et.z);
            addMesh(ewall);
            var eroof = makeMesh(new THREE.BoxGeometry(et.w + 1, 3, et.d + 1), 0x4a3a2a);
            eroof.position.set(ox + 16, et.h + 1.5, et.z);
            addMesh(eroof);
            // Chimney
            var echim = makeMesh(new THREE.BoxGeometry(1.5, 4, 1.5), 0x5a4a38);
            echim.position.set(ox + 17, et.h + 5, et.z - 2);
            addMesh(echim);
        }

        // West terrace — Victorian flint buildings
        var westTerraceData = [
            { z: -80,  w: 12, h: 10, d: 10 },
            { z: -60,  w: 12, h: 10, d: 10 },
            { z: -40,  w: 14, h: 11, d: 10 },
            { z: -20,  w: 12, h: 9,  d: 10 },
            { z: 0,    w: 12, h: 10, d: 10 },
            { z: 20,   w: 14, h: 11, d: 10 },
            { z: 40,   w: 12, h: 10, d: 10 },
            { z: 60,   w: 12, h: 9,  d: 10 },
            { z: 80,   w: 12, h: 10, d: 10 },
            { z: 100,  w: 14, h: 11, d: 10 },
            { z: 120,  w: 12, h: 10, d: 10 },
            { z: 140,  w: 12, h: 9,  d: 10 }
        ];
        for (var wt = 0; wt < westTerraceData.length; wt++) {
            var wtt = westTerraceData[wt];
            var wwall = makeMesh(new THREE.BoxGeometry(wtt.w, wtt.h, wtt.d), 0x7a7060);
            wwall.position.set(ox - 16, wtt.h / 2, wtt.z);
            addMesh(wwall);
            var wroof2 = makeMesh(new THREE.BoxGeometry(wtt.w + 1, 3, wtt.d + 1), 0x4a3a2a);
            wroof2.position.set(ox - 16, wtt.h + 1.5, wtt.z);
            addMesh(wroof2);
            // Chimney
            var wchim = makeMesh(new THREE.BoxGeometry(1.5, 4, 1.5), 0x5a4a38);
            wchim.position.set(ox - 17, wtt.h + 5, wtt.z - 2);
            addMesh(wchim);
        }

        // Back streets — cross streets with smaller buildings
        var crossStreetZ = [160, 190];
        for (var cs = 0; cs < crossStreetZ.length; cs++) {
            var csz = crossStreetZ[cs];
            var crossRoad = makeMesh(new THREE.BoxGeometry(60, 0.6, 8), 0x6a6a5a);
            crossRoad.position.set(ox, 0.3, csz);
            addMesh(crossRoad);
        }

        // Additional small flint cottages on back streets
        var cottageData = [
            { x: ox + 30, z: 170 },
            { x: ox + 45, z: 170 },
            { x: ox - 30, z: 170 },
            { x: ox - 45, z: 170 },
            { x: ox + 30, z: 200 },
            { x: ox + 45, z: 200 },
            { x: ox - 30, z: 200 },
            { x: ox - 45, z: 200 }
        ];
        for (var c = 0; c < cottageData.length; c++) {
            var cd = cottageData[c];
            var cot = makeMesh(new THREE.BoxGeometry(10, 7, 10), 0x7a7060);
            cot.position.set(cd.x, 3.5, cd.z);
            addMesh(cot);
            var cotRoof = makeMesh(new THREE.BoxGeometry(11, 3, 11), 0x4a3a2a);
            cotRoof.position.set(cd.x, 8.5, cd.z);
            addMesh(cotRoof);
        }

        // Town pub / inn — larger building
        var pub = makeMesh(new THREE.BoxGeometry(16, 10, 14), 0x8a7a60);
        pub.position.set(ox + 28, 5, -10);
        addMesh(pub);
        var pubRoof = makeMesh(new THREE.BoxGeometry(17, 4, 15), 0x4a3a2a);
        pubRoof.position.set(ox + 28, 12, -10);
        addMesh(pubRoof);
        var pubSign = makeMesh(new THREE.BoxGeometry(4, 3, 0.5), 0x8a5a20);
        pubSign.position.set(ox + 21, 7, -10);
        addMesh(pubSign);

        // Market square area
        var square = makeMesh(new THREE.BoxGeometry(28, 0.6, 24), 0x7a7060);
        square.position.set(ox + 50, 0.3, 20);
        addMesh(square);

        // Market cross / column
        var crossBase = makeMesh(new THREE.BoxGeometry(3, 1, 3), 0x9a8a70);
        crossBase.position.set(ox + 50, 0.5, 20);
        addMesh(crossBase);
        var crossPillar = makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 6), 0x9a8a70);
        crossPillar.position.set(ox + 50, 3.5, 20);
        addMesh(crossPillar);
        var crossTop = makeMesh(new THREE.SphereGeometry(1, 6, 6), 0x9a8a70);
        crossTop.position.set(ox + 50, 7, 20);
        addMesh(crossTop);
    }

    function update(delta) { }

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
