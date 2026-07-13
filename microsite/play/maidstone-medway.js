window.MaidstoneMedway = (function() {
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

    function build() {
        buildAllSaintsChurch();
        buildArchbishopsPalace();
        buildRiverMedway();
        buildMotePark();
        buildHighStreet();
    }

    // ---- 1. All Saints' Church ----
    function buildAllSaintsChurch() {
        var ox = 10720;
        var oz = -200;

        // Flint nave walls (long low box)
        var naveMat = new THREE.MeshLambertMaterial({ color: 0x7a7060 });
        var naveGeo = new THREE.BoxGeometry(36, 12, 14);
        addMesh(naveGeo, naveMat, ox + 0, 6, oz + 0);

        // Nave roof (low ridge)
        var naveRoofMat = new THREE.MeshLambertMaterial({ color: 0x555040 });
        var naveRoofGeo = new THREE.BoxGeometry(38, 3, 6);
        addMesh(naveRoofGeo, naveRoofMat, ox + 0, 13.5, oz + 0);

        // Chancel (shorter east end)
        var chancelMat = new THREE.MeshLambertMaterial({ color: 0x7a7060 });
        var chancelGeo = new THREE.BoxGeometry(14, 10, 10);
        addMesh(chancelGeo, chancelMat, ox + 25, 5, oz + 0);

        // Chancel roof
        var chancelRoofMat = new THREE.MeshLambertMaterial({ color: 0x555040 });
        var chancelRoofGeo = new THREE.BoxGeometry(15, 2.5, 5);
        addMesh(chancelRoofGeo, chancelRoofMat, ox + 25, 11.25, oz + 0);

        // Tower (perpendicular gothic — tall square)
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x6a6050 });
        var towerGeo = new THREE.BoxGeometry(10, 18, 10);
        addMesh(towerGeo, towerMat, ox - 23, 9, oz + 0);

        // Tower battlements
        var battMat = new THREE.MeshLambertMaterial({ color: 0x6a6050 });
        for (var bi = 0; bi < 4; bi++) {
            var battGeo = new THREE.BoxGeometry(2, 2, 2);
            addMesh(battGeo, battMat, ox - 25 + bi * 2.5, 19, oz - 3);
            addMesh(battGeo, battMat, ox - 25 + bi * 2.5, 19, oz + 3);
        }

        // Tower spire / pinnacle
        var pinnMat = new THREE.MeshLambertMaterial({ color: 0x444030 });
        var pinnGeo = new THREE.ConeGeometry(1.2, 5, 4);
        addMesh(pinnGeo, pinnMat, ox - 23, 20.5, oz + 0);

        // South transept
        var transMat = new THREE.MeshLambertMaterial({ color: 0x7a7060 });
        var transGeo = new THREE.BoxGeometry(10, 10, 10);
        addMesh(transGeo, transMat, ox + 0, 5, oz + 12);

        // South porch
        var porchMat = new THREE.MeshLambertMaterial({ color: 0x7a7060 });
        var porchGeo = new THREE.BoxGeometry(5, 6, 4);
        addMesh(porchGeo, porchMat, ox - 8, 3, oz + 9);

        // Churchyard ground
        var yardMat = new THREE.MeshLambertMaterial({ color: 0x4a6040 });
        var yardGeo = new THREE.BoxGeometry(70, 0.3, 50);
        addMesh(yardGeo, yardMat, ox + 0, 0.15, oz + 0);

        // Churchyard perimeter wall
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x888070 });
        addMesh(new THREE.BoxGeometry(70, 1.5, 0.5), wallMat, ox + 0, 0.75, oz - 25);
        addMesh(new THREE.BoxGeometry(70, 1.5, 0.5), wallMat, ox + 0, 0.75, oz + 25);
        addMesh(new THREE.BoxGeometry(0.5, 1.5, 50), wallMat, ox - 35, 0.75, oz + 0);
        addMesh(new THREE.BoxGeometry(0.5, 1.5, 50), wallMat, ox + 35, 0.75, oz + 0);

        // Gravestones (scattered)
        var graveMat = new THREE.MeshLambertMaterial({ color: 0x999080 });
        var gravePositions = [
            [10, 10], [15, -5], [-5, 14], [20, -12], [-10, 8],
            [8, -16], [25, 5], [-15, -10], [30, -8], [12, 20]
        ];
        for (var gi = 0; gi < gravePositions.length; gi++) {
            var gx = gravePositions[gi][0];
            var gz = gravePositions[gi][1];
            addMesh(new THREE.BoxGeometry(0.4, 1.2, 0.15), graveMat, ox + gx, 0.6, oz + gz);
        }

        // Yew trees
        var yewMat = new THREE.MeshLambertMaterial({ color: 0x1a3010 });
        var yewPositions = [[-28, -18], [-28, 18], [30, -18], [30, 18]];
        for (var yi = 0; yi < yewPositions.length; yi++) {
            addMesh(new THREE.CylinderGeometry(0.5, 0.8, 5, 6), yewMat, ox + yewPositions[yi][0], 2.5, oz + yewPositions[yi][1]);
        }
    }

    // ---- 2. Archbishop's Palace ----
    function buildArchbishopsPalace() {
        var ox = 10720;
        var oz = 80;

        // Great Hall — long low stone range
        var hallMat = new THREE.MeshLambertMaterial({ color: 0x8a7a60 });
        var hallGeo = new THREE.BoxGeometry(40, 9, 14);
        addMesh(hallGeo, hallMat, ox - 10, 4.5, oz + 0);

        // Hall roof
        var hallRoofMat = new THREE.MeshLambertMaterial({ color: 0x555040 });
        addMesh(new THREE.BoxGeometry(42, 2, 6), hallRoofMat, ox - 10, 10, oz + 0);

        // Gatehouse — medieval, tall
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x8a7a60 });
        var gateGeo = new THREE.BoxGeometry(10, 14, 8);
        addMesh(gateGeo, gateMat, ox - 32, 7, oz + 0);

        // Gatehouse arch opening
        var archMat = new THREE.MeshLambertMaterial({ color: 0x222010 });
        addMesh(new THREE.BoxGeometry(4, 7, 8.2), archMat, ox - 32, 3.5, oz + 0);

        // Gatehouse turrets
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x7a6a50 });
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 16, 8), turretMat, ox - 37, 8, oz - 4);
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 16, 8), turretMat, ox - 37, 8, oz + 4);
        addMesh(new THREE.ConeGeometry(2, 3, 8), turretMat, ox - 37, 17.5, oz - 4);
        addMesh(new THREE.ConeGeometry(2, 3, 8), turretMat, ox - 37, 17.5, oz + 4);

        // Wing / chapel range
        var chapMat = new THREE.MeshLambertMaterial({ color: 0x8a7a60 });
        addMesh(new THREE.BoxGeometry(12, 8, 20), chapMat, ox + 16, 4, oz + 0);

        // River frontage — low stone quay wall
        var quayMat = new THREE.MeshLambertMaterial({ color: 0x777060 });
        addMesh(new THREE.BoxGeometry(50, 2, 2), quayMat, ox - 10, 1, oz + 18);

        // Walled garden
        var gardenMat = new THREE.MeshLambertMaterial({ color: 0x4a6030 });
        addMesh(new THREE.BoxGeometry(20, 0.2, 18), gardenMat, ox + 28, 0.1, oz - 5);

        var gardenWallMat = new THREE.MeshLambertMaterial({ color: 0x8a7a60 });
        addMesh(new THREE.BoxGeometry(20, 2.5, 0.4), gardenWallMat, ox + 28, 1.25, oz - 14);
        addMesh(new THREE.BoxGeometry(20, 2.5, 0.4), gardenWallMat, ox + 28, 1.25, oz + 4);
        addMesh(new THREE.BoxGeometry(0.4, 2.5, 18), gardenWallMat, ox + 18, 1.25, oz - 5);
        addMesh(new THREE.BoxGeometry(0.4, 2.5, 18), gardenWallMat, ox + 38, 1.25, oz - 5);

        // Garden trees
        var treeMat = new THREE.MeshLambertMaterial({ color: 0x2a5020 });
        addMesh(new THREE.SphereGeometry(2.5, 6, 5), treeMat, ox + 24, 4, oz - 8);
        addMesh(new THREE.SphereGeometry(2.5, 6, 5), treeMat, ox + 32, 4, oz - 8);
    }

    // ---- 3. River Medway ----
    function buildRiverMedway() {
        var ox = 10720;
        var oz = 120;

        // River surface — wide blue
        var riverMat = new THREE.MeshLambertMaterial({ color: 0x2255aa });
        addMesh(new THREE.BoxGeometry(200, 0.3, 40), riverMat, ox + 0, -0.1, oz + 0);

        // Medieval stone bridge — 6 arches
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x888070 });
        // Bridge deck
        addMesh(new THREE.BoxGeometry(50, 1.5, 7), bridgeMat, ox + 0, 1.5, oz + 0);

        // Bridge piers (between arches)
        for (var pi = 0; pi < 7; pi++) {
            var px = ox - 25 + pi * 8.3;
            addMesh(new THREE.BoxGeometry(2.5, 4, 6), bridgeMat, px, 0.5, oz + 0);
        }

        // Bridge parapets
        var parasMat = new THREE.MeshLambertMaterial({ color: 0x777060 });
        addMesh(new THREE.BoxGeometry(50, 0.8, 0.5), parasMat, ox + 0, 2.65, oz - 3.5);
        addMesh(new THREE.BoxGeometry(50, 0.8, 0.5), parasMat, ox + 0, 2.65, oz + 3.5);

        // Bridge arch openings (darker under-arch)
        var archMat = new THREE.MeshLambertMaterial({ color: 0x333020 });
        for (var ai = 0; ai < 6; ai++) {
            var ax = ox - 20.8 + ai * 8.3;
            addMesh(new THREE.BoxGeometry(5.5, 2, 6.1), archMat, ax, 0.2, oz + 0);
        }

        // Bridge approach road east
        var roadMat = new THREE.MeshLambertMaterial({ color: 0x666050 });
        addMesh(new THREE.BoxGeometry(30, 0.2, 6), roadMat, ox + 40, 0.1, oz + 0);

        // Bridge approach road west
        addMesh(new THREE.BoxGeometry(30, 0.2, 6), roadMat, ox - 40, 0.1, oz + 0);

        // Quayside — north bank
        var quayMat = new THREE.MeshLambertMaterial({ color: 0x887060 });
        addMesh(new THREE.BoxGeometry(200, 1, 10), quayMat, ox + 0, 0.5, oz - 25);

        // Quayside warehouses
        var wareMat = new THREE.MeshLambertMaterial({ color: 0x6a5a48 });
        var wareRoofMat = new THREE.MeshLambertMaterial({ color: 0x554030 });
        for (var wi = 0; wi < 5; wi++) {
            var wx = ox - 80 + wi * 40;
            addMesh(new THREE.BoxGeometry(18, 8, 10), wareMat, wx, 4, oz - 38);
            addMesh(new THREE.BoxGeometry(19, 2, 4), wareRoofMat, wx, 9, oz - 38);
        }

        // Pleasure boats (on river)
        var boatMat = new THREE.MeshLambertMaterial({ color: 0xddcc88 });
        var boatHullMat = new THREE.MeshLambertMaterial({ color: 0x553311 });
        for (var boi = 0; boi < 3; boi++) {
            var bx = ox - 60 + boi * 60;
            addMesh(new THREE.BoxGeometry(6, 1.2, 2.5), boatHullMat, bx, 0.6, oz + 10);
            addMesh(new THREE.BoxGeometry(4, 1.5, 2), boatMat, bx, 1.95, oz + 10);
            // Mast
            addMesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 4), boatMat, bx, 4.5, oz + 10);
        }

        // River south bank edge
        var bankMat = new THREE.MeshLambertMaterial({ color: 0x4a6030 });
        addMesh(new THREE.BoxGeometry(200, 0.5, 8), bankMat, ox + 0, 0.25, oz + 24);
    }

    // ---- 4. Mote Park ----
    function buildMotePark() {
        var ox = 10720;
        var oz = -500;

        // Park ground
        var parkMat = new THREE.MeshLambertMaterial({ color: 0x3a7030 });
        addMesh(new THREE.BoxGeometry(180, 0.3, 160), parkMat, ox + 20, 0.15, oz + 0);

        // Lake (blue flat)
        var lakeMat = new THREE.MeshLambertMaterial({ color: 0x3377bb });
        addMesh(new THREE.BoxGeometry(70, 0.25, 45), lakeMat, ox + 40, 0.2, oz + 30);

        // Lake edge / shore
        var shoreMat = new THREE.MeshLambertMaterial({ color: 0x6a8840 });
        addMesh(new THREE.BoxGeometry(74, 0.3, 49), shoreMat, ox + 40, 0.12, oz + 30);

        // Mote House — Palladian manor
        var houseMat = new THREE.MeshLambertMaterial({ color: 0xe8ddc0 });
        // Main body
        addMesh(new THREE.BoxGeometry(30, 10, 16), houseMat, ox - 40, 5, oz - 30);

        // Pediment (triangular front)
        var pedMat = new THREE.MeshLambertMaterial({ color: 0xd8cdb0 });
        addMesh(new THREE.BoxGeometry(22, 4, 1), pedMat, ox - 40, 12, oz - 38.5);

        // Pediment triangle top
        var pedTopMat = new THREE.MeshLambertMaterial({ color: 0xd8cdb0 });
        addMesh(new THREE.ConeGeometry(11, 4, 3), pedTopMat, ox - 40, 15, oz - 38.5);

        // Palladian columns (front row)
        var colMat = new THREE.MeshLambertMaterial({ color: 0xf0e8d0 });
        for (var ci = 0; ci < 5; ci++) {
            var cx = ox - 48 + ci * 4;
            addMesh(new THREE.CylinderGeometry(0.5, 0.6, 10, 8), colMat, cx, 5, oz - 38);
        }

        // Column capitals (flat boxes)
        var capMat = new THREE.MeshLambertMaterial({ color: 0xf0e8d0 });
        for (var cci = 0; cci < 5; cci++) {
            var ccx = ox - 48 + cci * 4;
            addMesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), capMat, ccx, 10.25, oz - 38);
        }

        // Side wings
        var wingMat = new THREE.MeshLambertMaterial({ color: 0xe8ddc0 });
        addMesh(new THREE.BoxGeometry(10, 7, 12), wingMat, ox - 60, 3.5, oz - 30);
        addMesh(new THREE.BoxGeometry(10, 7, 12), wingMat, ox - 20, 3.5, oz - 30);

        // House roof
        var houseRoofMat = new THREE.MeshLambertMaterial({ color: 0x666050 });
        addMesh(new THREE.BoxGeometry(32, 2, 8), houseRoofMat, ox - 40, 11, oz - 30);

        // Boathouse on lake
        var boathouseMat = new THREE.MeshLambertMaterial({ color: 0x7a6040 });
        addMesh(new THREE.BoxGeometry(8, 4, 6), boathouseMat, ox + 10, 2, oz + 30);
        addMesh(new THREE.BoxGeometry(8, 1.5, 3), boathouseMat, ox + 10, 5, oz + 30);

        // Boathouse jetty
        var jettyMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
        addMesh(new THREE.BoxGeometry(1, 0.3, 10), jettyMat, ox + 15, 0.5, oz + 25);

        // Park trees (scattered)
        var treeMat1 = new THREE.MeshLambertMaterial({ color: 0x2a6020 });
        var treeMat2 = new THREE.MeshLambertMaterial({ color: 0x3a7030 });
        var treeData = [
            [-20, -60, 4, 0], [60, -60, 5, 1], [80, -20, 3.5, 0],
            [80, 60, 4, 1], [60, 70, 3, 0], [-30, 70, 4.5, 1],
            [-50, 20, 3, 0], [10, -70, 4, 1], [100, 0, 5, 0],
            [-60, -60, 3.5, 1], [110, 40, 4, 0], [20, -10, 3, 1]
        ];
        for (var ti = 0; ti < treeData.length; ti++) {
            var td = treeData[ti];
            var tmat = td[3] === 0 ? treeMat1 : treeMat2;
            var trunkMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
            addMesh(new THREE.CylinderGeometry(0.3, 0.5, td[2], 5), trunkMat, ox + td[0], td[2] / 2, oz + td[1]);
            addMesh(new THREE.SphereGeometry(td[2] * 0.7, 6, 5), tmat, ox + td[0], td[2] + td[2] * 0.5, oz + td[1]);
        }

        // Park perimeter fence
        var fenceMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
        addMesh(new THREE.BoxGeometry(180, 1.2, 0.3), fenceMat, ox + 20, 0.6, oz - 80);
        addMesh(new THREE.BoxGeometry(180, 1.2, 0.3), fenceMat, ox + 20, 0.6, oz + 80);
        addMesh(new THREE.BoxGeometry(0.3, 1.2, 160), fenceMat, ox - 70, 0.6, oz + 0);
        addMesh(new THREE.BoxGeometry(0.3, 1.2, 160), fenceMat, ox + 110, 0.6, oz + 0);

        // Ornamental fountain
        var fountMat = new THREE.MeshLambertMaterial({ color: 0x8899aa });
        addMesh(new THREE.CylinderGeometry(3, 3.5, 0.5, 12), fountMat, ox - 40, 0.5, oz + 20);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 8), fountMat, ox - 40, 2, oz + 20);
        addMesh(new THREE.SphereGeometry(0.8, 8, 6), fountMat, ox - 40, 3.8, oz + 20);

        // Bandstand
        var bandMat = new THREE.MeshLambertMaterial({ color: 0x99aa66 });
        addMesh(new THREE.CylinderGeometry(4, 4, 0.3, 8), bandMat, ox + 60, 0.3, oz - 50);
        addMesh(new THREE.ConeGeometry(5, 3, 8), bandMat, ox + 60, 3.8, oz - 50);
        for (var bsi = 0; bsi < 8; bsi++) {
            var bsAngle = (bsi / 8) * Math.PI * 2;
            addMesh(new THREE.CylinderGeometry(0.15, 0.15, 3.5, 4), bandMat,
                ox + 60 + Math.cos(bsAngle) * 3.8, 1.75, oz - 50 + Math.sin(bsAngle) * 3.8);
        }
    }

    // ---- 5. High Street ----
    function buildHighStreet() {
        var ox = 10720;
        var oz = -50;

        // Road surface
        var roadMat = new THREE.MeshLambertMaterial({ color: 0x555045 });
        addMesh(new THREE.BoxGeometry(120, 0.2, 10), roadMat, ox + 0, 0.1, oz + 0);

        // Pavement (both sides)
        var paveMat = new THREE.MeshLambertMaterial({ color: 0x999080 });
        addMesh(new THREE.BoxGeometry(120, 0.25, 4), paveMat, ox + 0, 0.12, oz - 7);
        addMesh(new THREE.BoxGeometry(120, 0.25, 4), paveMat, ox + 0, 0.12, oz + 7);

        // Victorian commercial buildings — north side
        var buildData = [
            { w: 14, h: 11, d: 10, offx: -50, side: -14, col: 0x8a7060 },
            { w: 12, h: 9,  d: 10, offx: -36, side: -14, col: 0x7a6a58 },
            { w: 16, h: 13, d: 10, offx: -20, side: -14, col: 0x886655 },
            { w: 10, h: 10, d: 10, offx: -5,  side: -14, col: 0x8a7a60 },
            { w: 14, h: 12, d: 10, offx: 9,   side: -14, col: 0x776655 },
            { w: 12, h: 10, d: 10, offx: 22,  side: -14, col: 0x887760 },
            { w: 14, h: 11, d: 10, offx: 36,  side: -14, col: 0x7a6a50 },
            { w: 12, h: 9,  d: 10, offx: 50,  side: -14, col: 0x886644 }
        ];

        for (var bi = 0; bi < buildData.length; bi++) {
            var bd = buildData[bi];
            var bldMat = new THREE.MeshLambertMaterial({ color: bd.col });
            addMesh(new THREE.BoxGeometry(bd.w, bd.h, bd.d), bldMat, ox + bd.offx, bd.h / 2, oz + bd.side);
            // Simple parapet / cornice
            var cornMat = new THREE.MeshLambertMaterial({ color: 0xaaa090 });
            addMesh(new THREE.BoxGeometry(bd.w + 0.5, 0.8, 0.6), cornMat, ox + bd.offx, bd.h + 0.4, oz + bd.side);
        }

        // South side buildings
        var buildDataS = [
            { w: 14, h: 10, d: 10, offx: -50, col: 0x887060 },
            { w: 16, h: 12, d: 10, offx: -34, col: 0x776858 },
            { w: 12, h: 9,  d: 10, offx: -19, col: 0x8a7a60 },
            { w: 14, h: 11, d: 10, offx: -5,  col: 0x887060 },
            { w: 12, h: 10, d: 10, offx: 9,   col: 0x777060 },
            { w: 14, h: 12, d: 10, offx: 22,  col: 0x886655 },
            { w: 12, h: 9,  d: 10, offx: 36,  col: 0x8a7a60 },
            { w: 14, h: 11, d: 10, offx: 50,  col: 0x776655 }
        ];

        for (var si = 0; si < buildDataS.length; si++) {
            var sd = buildDataS[si];
            var sMat = new THREE.MeshLambertMaterial({ color: sd.col });
            addMesh(new THREE.BoxGeometry(sd.w, sd.h, 10), sMat, ox + sd.offx, sd.h / 2, oz + 14);
            var sCornMat = new THREE.MeshLambertMaterial({ color: 0xaaa090 });
            addMesh(new THREE.BoxGeometry(sd.w + 0.5, 0.8, 0.6), sCornMat, ox + sd.offx, sd.h + 0.4, oz + 14);
        }

        // County Hall — prominent with dome
        var hallMat = new THREE.MeshLambertMaterial({ color: 0xd4c89a });
        addMesh(new THREE.BoxGeometry(28, 14, 16), hallMat, ox + 55, 7, oz - 22);

        // County Hall columns portico
        var chColMat = new THREE.MeshLambertMaterial({ color: 0xe8ddc8 });
        for (var chi = 0; chi < 6; chi++) {
            addMesh(new THREE.CylinderGeometry(0.6, 0.7, 14, 8), chColMat, ox + 44 + chi * 3.2, 7, oz - 30);
        }

        // County Hall pediment
        var chPedMat = new THREE.MeshLambertMaterial({ color: 0xd4c89a });
        addMesh(new THREE.BoxGeometry(22, 3, 1), chPedMat, ox + 55, 15.5, oz - 30.5);

        // County Hall dome (cylinder + sphere)
        var domeMat = new THREE.MeshLambertMaterial({ color: 0xbbaa80 });
        addMesh(new THREE.CylinderGeometry(4, 4, 3, 12), domeMat, ox + 55, 16.5, oz - 22);
        addMesh(new THREE.SphereGeometry(4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), domeMat, ox + 55, 18, oz - 22);

        // Dome lantern
        var lanternMat = new THREE.MeshLambertMaterial({ color: 0xccbb88 });
        addMesh(new THREE.CylinderGeometry(0.8, 1, 3, 8), lanternMat, ox + 55, 23, oz - 22);

        // Market stalls (in street)
        var stallMat = new THREE.MeshLambertMaterial({ color: 0xcc4422 });
        var stallRoofMat = new THREE.MeshLambertMaterial({ color: 0xaa3311 });
        for (var mi = 0; mi < 4; mi++) {
            var mx = ox - 30 + mi * 20;
            addMesh(new THREE.BoxGeometry(4, 2.5, 2), stallMat, mx, 1.25, oz + 0);
            addMesh(new THREE.BoxGeometry(5, 0.4, 3), stallRoofMat, mx, 2.7, oz + 0);
        }

        // Street lights
        var lightPoleMat = new THREE.MeshLambertMaterial({ color: 0x888878 });
        var lightHeadMat = new THREE.MeshLambertMaterial({ color: 0xffffcc });
        for (var li = 0; li < 6; li++) {
            var lx = ox - 50 + li * 20;
            addMesh(new THREE.CylinderGeometry(0.12, 0.15, 5, 5), lightPoleMat, lx, 2.5, oz - 9);
            addMesh(new THREE.SphereGeometry(0.35, 5, 4), lightHeadMat, lx, 5.35, oz - 9);
        }

        // Pub / inn buildings (distinctive)
        var pubMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
        addMesh(new THREE.BoxGeometry(10, 10, 10), pubMat, ox - 60, 5, oz - 14);
        addMesh(new THREE.BoxGeometry(11, 0.7, 0.5), pubMat, ox - 60, 10.35, oz - 14);

        // Sign board
        var signMat = new THREE.MeshLambertMaterial({ color: 0x8855ff });
        addMesh(new THREE.BoxGeometry(3, 1.5, 0.2), signMat, ox - 60, 8, oz - 19.6);
    }

    function update(delta) {
        // Static environment — no animation needed
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
