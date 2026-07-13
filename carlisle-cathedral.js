window.CarlisleCathedral = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 22080;
    var OY = 0;
    var OZ = 0;

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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildCathedral();
        buildCastleCarlisle();
        buildHadriansWall();
        buildRiverEden();
        buildBittsPark();
        buildCitadel();
        buildMarket();
        buildScottishFields();
        buildCityBuildings();
    }

    // ---------------------------------------------------------------
    // GROUND BASE
    // ---------------------------------------------------------------
    function buildGround() {
        // City ground base — Carlisle sits on a sandstone plateau
        makeBox(1200, 4, 1200, 0x8B7355, 0, -2, 0);

        // Raised city centre plateau
        makeBox(500, 3, 500, 0x9B8365, 0, 0.5, 0);

        // Road grid — English Street / Botchergate main axis
        makeBox(600, 0.5, 14, 0x555555, 0, 2.5, 0);
        makeBox(14, 0.5, 600, 0x555555, 0, 2.5, 0);

        // Castle road
        makeBox(200, 0.5, 10, 0x555555, -120, 2.5, -80);

        // Pavement strips
        makeBox(600, 0.4, 4, 0xCCBB99, 0, 2.5, 8);
        makeBox(600, 0.4, 4, 0xCCBB99, 0, 2.5, -8);
    }

    // ---------------------------------------------------------------
    // CARLISLE CATHEDRAL (0xD4A870 pink sandstone)
    // Very short nave — much destroyed in Civil War
    // Beautiful east window, 8-sided chapter house
    // ---------------------------------------------------------------
    function buildCathedral() {
        var sc = 0xD4A870;   // pink sandstone
        var rf = 0xB8864A;   // darker sandstone for roofs
        var win = 0x88AACC;  // stained glass blue-purple

        // --- SHORT NAVE (much was destroyed in Civil War) ---
        makeBox(28, 18, 16, sc, 0, 9, 50);           // nave walls
        makeBox(30, 1, 18, rf, 0, 18.5, 50);          // nave roof base

        // Nave clerestory windows (pairs each side)
        makeBox(3, 5, 1, win, -8, 14, 42);
        makeBox(3, 5, 1, win, 0, 14, 42);
        makeBox(3, 5, 1, win, 8, 14, 42);
        makeBox(3, 5, 1, win, -8, 14, 58);
        makeBox(3, 5, 1, win, 0, 14, 58);
        makeBox(3, 5, 1, win, 8, 14, 58);

        // Nave pitched roof (box approximation)
        makeBox(32, 5, 20, rf, 0, 22, 50);

        // --- CROSSING TOWER ---
        makeBox(18, 30, 18, sc, 0, 15, 30);           // crossing tower body
        makeBox(20, 1, 20, 0xBB8844, 0, 31, 30);      // tower parapet base
        makeBox(18, 4, 2, sc, 0, 33, 20);              // parapet N
        makeBox(18, 4, 2, sc, 0, 33, 40);              // parapet S
        makeBox(2, 4, 18, sc, -9, 33, 30);             // parapet W
        makeBox(2, 4, 18, sc, 9, 33, 30);              // parapet E

        // Tower corner turrets
        makeCyl(1.5, 1.5, 8, 8, sc, -9, 35, 20);
        makeCyl(1.5, 1.5, 8, 8, sc, 9, 35, 20);
        makeCyl(1.5, 1.5, 8, 8, sc, -9, 35, 40);
        makeCyl(1.5, 1.5, 8, 8, sc, 9, 35, 40);
        // turret caps
        makeCone(2, 4, 8, rf, -9, 40, 20);
        makeCone(2, 4, 8, rf, 9, 40, 20);
        makeCone(2, 4, 8, rf, -9, 40, 40);
        makeCone(2, 4, 8, rf, 9, 40, 40);

        // --- CHOIR / CHANCEL (longer than nave — Civil War spared it) ---
        makeBox(20, 20, 40, sc, 0, 10, 0);             // choir body
        makeBox(22, 1, 42, rf, 0, 21, 0);              // choir roof base
        makeBox(22, 6, 42, rf, 0, 25, 0);              // choir pitched roof

        // Choir aisle north
        makeBox(8, 14, 38, sc, -14, 7, 0);
        makeBox(10, 2, 40, rf, -14, 15, 0);

        // Choir aisle south
        makeBox(8, 14, 38, sc, 14, 7, 0);
        makeBox(10, 2, 40, rf, 14, 15, 0);

        // --- EAST END / GREAT EAST WINDOW (most famous feature) ---
        makeBox(20, 26, 3, sc, 0, 13, -21);            // east wall
        makeBox(16, 22, 1, win, 0, 14, -20);           // THE great east window (enormous)
        // Window tracery divisions
        makeBox(0.8, 22, 1, sc, -5, 14, -19.5);
        makeBox(0.8, 22, 1, sc, 0, 14, -19.5);
        makeBox(0.8, 22, 1, sc, 5, 14, -19.5);
        makeBox(16, 0.8, 1, sc, 0, 6, -19.5);
        makeBox(16, 0.8, 1, sc, 0, 16, -19.5);
        // Round window above
        makeSphere(3, 8, 6, win, 0, 27, -20);

        // --- NORTH TRANSEPT ---
        makeBox(16, 22, 20, sc, -18, 11, 25);
        makeBox(18, 5, 22, rf, -18, 24, 25);

        // --- SOUTH TRANSEPT ---
        makeBox(16, 22, 20, sc, 18, 11, 25);
        makeBox(18, 5, 22, rf, 18, 24, 25);

        // --- 8-SIDED CHAPTER HOUSE (unique Carlisle feature) ---
        makeCyl(12, 12, 14, 8, sc, -32, 7, 5);         // octagonal chapter house
        makeCyl(12, 12, 1, 8, rf, -32, 14.5, 5);        // chapter house roof rim
        makeCone(11, 10, 8, rf, -32, 21, 5);             // chapter house conical roof
        // Chapter house windows (8 sides)
        for (var ci = 0; ci < 8; ci++) {
            var cang = (ci / 8) * Math.PI * 2;
            var cwx = -32 + Math.sin(cang) * 11.5;
            var cwz = 5 + Math.cos(cang) * 11.5;
            var cwin = new THREE.Mesh(
                new THREE.BoxGeometry(2, 4, 0.5),
                new THREE.MeshLambertMaterial({ color: win })
            );
            cwin.position.set(OX + cwx, OY + 8, OZ + cwz);
            cwin.rotation.y = cang;
            addMesh(cwin);
        }

        // --- WEST FRONT (entrance) ---
        makeBox(28, 20, 3, sc, 0, 10, 62);             // west wall
        makeBox(6, 12, 1, win, 0, 10, 61);              // west window
        makeBox(5, 9, 3, 0x554433, 0, 4, 63);           // main door

        // Cathedral close / precinct wall
        makeBox(100, 4, 2, sc, 0, 2, 80);
        makeBox(2, 4, 80, sc, -50, 2, 40);
        makeBox(2, 4, 80, sc, 50, 2, 40);
    }

    // ---------------------------------------------------------------
    // CARLISLE CASTLE (0xAAAAAA Norman castle)
    // Keep, inner/outer wards, gatehouse, curtain walls
    // ---------------------------------------------------------------
    function buildCastleCarlisle() {
        var cs = 0xAAAAAA;   // grey sandstone
        var dk = 0x888888;   // darker grey
        var gat = 0x666666;  // gatehouse dark

        // --- KEEP (Norman square keep on motte) ---
        makeBox(28, 36, 28, cs, -120, 18, -80);        // keep body
        makeBox(32, 3, 32, dk, -120, 37, -80);          // keep parapet
        // Keep corner towers
        makeCyl(4, 4, 42, 10, cs, -134, 21, -94);
        makeCyl(4, 4, 42, 10, cs, -106, 21, -94);
        makeCyl(4, 4, 42, 10, cs, -134, 21, -66);
        makeCyl(4, 4, 42, 10, cs, -106, 21, -66);
        // Keep battlements
        makeBox(28, 4, 2, cs, -120, 40, -94);
        makeBox(28, 4, 2, cs, -120, 40, -66);
        makeBox(2, 4, 28, cs, -134, 40, -80);
        makeBox(2, 4, 28, cs, -106, 40, -80);
        // Keep entrance
        makeBox(5, 8, 3, gat, -120, 4, -66);

        // --- INNER WARD CURTAIN WALLS ---
        makeBox(80, 10, 3, cs, -120, 5, -115);          // N wall
        makeBox(80, 10, 3, cs, -120, 5, -45);            // S wall
        makeBox(3, 10, 72, cs, -160, 5, -80);            // W wall
        makeBox(3, 10, 72, cs, -80, 5, -80);             // E wall

        // Inner ward towers
        makeCyl(5, 5, 14, 10, cs, -140, 7, -115);
        makeCyl(5, 5, 14, 10, cs, -100, 7, -115);
        makeCyl(5, 5, 14, 10, cs, -140, 7, -45);
        makeCyl(5, 5, 14, 10, cs, -100, 7, -45);

        // --- GATEHOUSE (inner ward) ---
        makeBox(16, 18, 12, dk, -80, 9, -80);            // gatehouse body
        makeBox(5, 14, 6, gat, -80, 7, -80);              // gate passage
        makeCyl(5, 5, 22, 10, cs, -88, 11, -80);          // gatehouse tower L
        makeCyl(5, 5, 22, 10, cs, -72, 11, -80);          // gatehouse tower R

        // --- OUTER WARD CURTAIN WALLS ---
        makeBox(130, 8, 3, cs, -120, 4, -145);            // N outer wall
        makeBox(130, 8, 3, cs, -120, 4, -20);             // S outer wall
        makeBox(3, 8, 128, cs, -185, 4, -82);             // W outer wall
        makeBox(3, 8, 128, cs, -55, 4, -82);              // E outer wall

        // Outer ward interval towers
        makeCyl(4, 4, 12, 10, cs, -155, 6, -145);
        makeCyl(4, 4, 12, 10, cs, -85, 6, -145);
        makeCyl(4, 4, 12, 10, cs, -155, 6, -20);
        makeCyl(4, 4, 12, 10, cs, -85, 6, -20);
        makeCyl(4, 4, 12, 10, cs, -185, 6, -110);
        makeCyl(4, 4, 12, 10, cs, -185, 6, -52);

        // --- CASTLE WELL ---
        makeCyl(3, 3, 4, 12, dk, -120, 2, -100);

        // --- BARRACKS BUILDING (used as military barracks up to 1960s) ---
        makeBox(50, 10, 16, 0x999988, -130, 5, -38);
        makeBox(52, 1, 18, dk, -130, 10.5, -38);
        // Barracks windows
        for (var bi = 0; bi < 5; bi++) {
            makeBox(3, 4, 1, 0x8899AA, -150 + bi * 12, 7, -30);
        }
    }

    // ---------------------------------------------------------------
    // HADRIAN'S WALL (0x888888)
    // Roman wall runs east and west through Carlisle
    // ---------------------------------------------------------------
    function buildHadriansWall() {
        var wc = 0x888888;
        var mc = 0x777777;   // milecastle

        // Wall running west from city
        makeBox(300, 4, 6, wc, -230, 2, -200);
        makeBox(300, 4, 6, wc, -530, 2, -200);

        // Wall running east from city
        makeBox(300, 4, 6, wc, 230, 2, -200);
        makeBox(300, 4, 6, wc, 530, 2, -200);

        // Milecastle west
        makeBox(20, 6, 20, mc, -250, 3, -200);
        makeBox(22, 1, 22, mc, -250, 6.5, -200);

        // Milecastle east
        makeBox(20, 6, 20, mc, 250, 3, -200);
        makeBox(22, 1, 22, mc, 250, 6.5, -200);

        // Vallum (ditch earthwork south of wall) — low earthwork
        makeBox(600, 2, 8, 0x7A6A4A, 0, 1, -215);

        // North ditch (berm) — slightly raised
        makeBox(600, 1.5, 6, 0x7A6A4A, 0, 1, -185);

        // Turrets on the wall
        makeBox(6, 7, 8, mc, -100, 3.5, -200);
        makeBox(6, 7, 8, mc, 100, 3.5, -200);
        makeBox(6, 7, 8, mc, -380, 3.5, -200);
        makeBox(6, 7, 8, mc, 380, 3.5, -200);
    }

    // ---------------------------------------------------------------
    // RIVER EDEN (0x4682B4)
    // Wide river flowing NW past city
    // ---------------------------------------------------------------
    function buildRiverEden() {
        var rc = 0x4682B4;   // steel blue water
        var rb = 0x8B7355;   // riverbank

        // Main river channel — wide and meandering NW
        makeBox(500, 1, 40, rc, -100, 0.2, -280);
        makeBox(400, 1, 50, rc, -200, 0.2, -320);
        makeBox(300, 1, 45, rc, -280, 0.2, -370);

        // River bend sections
        makeBox(60, 1, 120, rc, -80, 0.2, -310);

        // River banks
        makeBox(500, 2, 10, rb, -100, 0.5, -260);
        makeBox(500, 2, 10, rb, -100, 0.5, -300);

        // Eden Bridge (stone arches approximated with boxes)
        makeBox(60, 5, 14, 0x999988, -50, 3, -280);
        makeBox(12, 4, 16, 0x7A6A5A, -80, 2, -280);
        makeBox(12, 4, 16, 0x7A6A5A, -50, 2, -280);
        makeBox(12, 4, 16, 0x7A6A5A, -20, 2, -280);

        // River Eden upper reach
        makeBox(200, 1, 38, rc, 150, 0.2, -280);
    }

    // ---------------------------------------------------------------
    // BITTS PARK (0x4CAF50)
    // Riverside park between castle and river
    // ---------------------------------------------------------------
    function buildBittsPark() {
        var gc = 0x4CAF50;   // bright park green
        var tc = 0x2E7D32;   // tree dark green
        var tk = 0x5D4037;   // tree trunk brown

        // Park lawn areas
        makeBox(120, 0.5, 80, gc, -130, 0.3, -185);
        makeBox(80, 0.5, 60, gc, -170, 0.3, -200);

        // Park paths
        makeBox(80, 0.6, 3, 0xD2B48C, -130, 0.4, -185);
        makeBox(3, 0.6, 80, 0xD2B48C, -130, 0.4, -200);

        // Bandstand (Victorian feature)
        makeCyl(8, 8, 1, 0xCCBB88, -150, 0.6, -190);   // bandstand floor
        makeCyl(0.5, 0.5, 6, 8, 0xAA9966, -158, 3.5, -190); // support post
        makeCyl(0.5, 0.5, 6, 8, 0xAA9966, -142, 3.5, -190);
        makeCyl(0.5, 0.5, 6, 8, 0xAA9966, -150, 3.5, -182);
        makeCyl(0.5, 0.5, 6, 8, 0xAA9966, -150, 3.5, -198);
        makeCone(10, 5, 8, 0xAA8833, -150, 10, -190);   // bandstand roof

        // Park trees (cylinders for trunks, spheres for canopy)
        var treePositions = [
            [-115, -175], [-125, -195], [-140, -175], [-115, -210],
            [-145, -205], [-165, -185], [-175, -195], [-160, -210]
        ];
        for (var ti = 0; ti < treePositions.length; ti++) {
            var tx = treePositions[ti][0];
            var tz = treePositions[ti][1];
            makeCyl(0.6, 0.8, 5, 6, tk, tx, 2.5, tz);
            makeSphere(3.5, 8, 6, tc, tx, 7, tz);
        }

        // Fountain
        makeCyl(4, 4, 0.5, 12, 0xCCCCCC, -135, 0.6, -175);
        makeCyl(0.3, 0.3, 4, 8, 0xBBBBBB, -135, 2.5, -175);
        makeSphere(1.5, 8, 6, rc, -135, 5, -175);

        // War memorial
        makeBox(3, 12, 3, 0xCCCCCC, -120, 6, -190);
        makeSphere(2, 8, 6, 0xDDDDDD, -120, 13, -190);
    }

    // ---------------------------------------------------------------
    // CITADEL — twin round towers (Henry VIII, 1541)
    // Guarding old city gate, now courts
    // ---------------------------------------------------------------
    function buildCitadel() {
        var cc = 0xAAAAAA;   // grey stone
        var cd = 0x888888;   // darker detail

        // East Citadel Tower
        makeCyl(12, 12, 22, 16, cc, 50, 11, 90);
        makeCyl(13, 13, 2, 16, cd, 50, 23, 90);         // parapet ring
        makeCyl(12, 12, 3, 16, cc, 50, 25.5, 90);       // upper drum
        makeCyl(13, 13, 1, 16, cd, 50, 27, 90);          // battlements base
        // East tower windows
        makeBox(2, 3, 1, 0x8899AA, 50, 12, 78);
        makeBox(2, 3, 1, 0x8899AA, 62, 12, 90);
        makeBox(2, 3, 1, 0x8899AA, 50, 18, 78);

        // West Citadel Tower
        makeCyl(12, 12, 22, 16, cc, 20, 11, 90);
        makeCyl(13, 13, 2, 16, cd, 20, 23, 90);
        makeCyl(12, 12, 3, 16, cc, 20, 25.5, 90);
        makeCyl(13, 13, 1, 16, cd, 20, 27, 90);
        // West tower windows
        makeBox(2, 3, 1, 0x8899AA, 20, 12, 78);
        makeBox(2, 3, 1, 0x8899AA, 8, 12, 90);
        makeBox(2, 3, 1, 0x8899AA, 20, 18, 78);

        // Connecting wall / gateway between towers
        makeBox(18, 18, 10, cc, 35, 9, 90);
        makeBox(7, 12, 11, 0x333333, 35, 6, 90);          // gateway arch/passage

        // Citadel curtain walls going north to city
        makeBox(3, 8, 40, cd, 50, 4, 70);
        makeBox(3, 8, 40, cd, 20, 4, 70);

        // Courts building (Victorian neoclassical interior within towers)
        makeBox(14, 12, 14, 0xBBAA88, 50, 6, 90);
        makeBox(14, 12, 14, 0xBBAA88, 20, 6, 90);
    }

    // ---------------------------------------------------------------
    // CARLISLE MARKET
    // Old market cross, market hall, Victorian shopping arcade
    // ---------------------------------------------------------------
    function buildMarket() {
        var mc = 0xDEB887;   // burlywood / sandstone market
        var mv = 0xBB9966;   // Victorian brick

        // --- OLD MARKET CROSS ---
        makeBox(6, 0.5, 6, 0xCCBBAA, 60, 2.3, 20);      // cross base plinth
        makeBox(4, 0.5, 4, 0xBBAA99, 60, 2.8, 20);
        makeBox(2, 0.5, 2, 0xAA9988, 60, 3.3, 20);
        makeCyl(0.4, 0.6, 10, 8, 0xCCBBAA, 60, 8.5, 20); // cross shaft
        makeBox(4, 0.5, 0.5, 0xCCBBAA, 60, 14, 20);       // cross arms
        makeBox(0.5, 4, 0.5, 0xCCBBAA, 60, 14.5, 20);     // cross upright top

        // --- MARKET HALL (Victorian) ---
        makeBox(60, 12, 30, mc, 80, 6, 20);               // main market hall body
        makeBox(62, 1, 32, mv, 80, 12.5, 20);              // cornice
        makeBox(60, 6, 30, 0x99AACC, 80, 16, 20);          // glazed roof (iron and glass)
        // Market hall entrance arch
        makeBox(10, 10, 2, mv, 80, 5, 5);
        makeBox(8, 8, 1, 0x88AACC, 80, 5, 4.5);           // glazed door

        // Market hall columns
        makeCyl(0.8, 0.8, 12, 8, mv, 55, 6, 6);
        makeCyl(0.8, 0.8, 12, 8, mv, 105, 6, 6);
        makeCyl(0.8, 0.8, 12, 8, mv, 55, 6, 35);
        makeCyl(0.8, 0.8, 12, 8, mv, 105, 6, 35);

        // --- VICTORIAN SHOPPING ARCADE ---
        makeBox(8, 10, 40, mc, 115, 5, 20);               // arcade side wall L
        makeBox(8, 10, 40, mc, 125, 5, 20);               // arcade side wall R
        makeBox(10, 6, 40, 0x99AACC, 120, 13, 20);        // arcade glazed barrel roof
        // Arcade shop fronts
        makeBox(1, 8, 6, mv, 115, 4, 5);
        makeBox(1, 8, 6, mv, 115, 4, 15);
        makeBox(1, 8, 6, mv, 115, 4, 25);
        makeBox(1, 8, 6, mv, 115, 4, 35);

        // --- GREENMARKET / OUTDOOR STALLS ---
        makeBox(12, 0.5, 6, 0xDDCC99, 45, 2.4, 35);
        makeBox(12, 0.5, 6, 0xDDCC99, 45, 2.4, 45);
        makeBox(12, 0.5, 6, 0xDDCC99, 60, 2.4, 35);
        makeBox(12, 0.5, 6, 0xDDCC99, 60, 2.4, 45);
        // Stall awnings
        makeBox(12, 0.3, 6, 0xCC4444, 45, 4, 35);
        makeBox(12, 0.3, 6, 0x4444CC, 45, 4, 45);
        makeBox(12, 0.3, 6, 0x44CC44, 60, 4, 35);
        makeBox(12, 0.3, 6, 0xCCCC44, 60, 4, 45);

        // Tullie House Museum (near cathedral / castle)
        makeBox(40, 14, 20, 0xCC9966, -55, 7, 40);
        makeBox(42, 2, 22, 0xBB8855, -55, 15, 40);
        // Museum windows
        makeBox(3, 5, 1, 0x88AACC, -65, 10, 30);
        makeBox(3, 5, 1, 0x88AACC, -55, 10, 30);
        makeBox(3, 5, 1, 0x88AACC, -45, 10, 30);
    }

    // ---------------------------------------------------------------
    // SCOTTISH BORDER FIELDS (0x8AB55A)
    // Green fields stretching north — Carlisle fought over constantly
    // ---------------------------------------------------------------
    function buildScottishFields() {
        var fg = 0x8AB55A;   // field green
        var hg = 0x6B9E3A;   // hedge green
        var ro = 0x888888;   // road

        // Northern fields stretching toward Scotland
        makeBox(600, 0.5, 200, fg, 0, 0.1, -420);
        makeBox(600, 0.5, 200, fg, 0, 0.1, -620);
        makeBox(600, 0.5, 200, fg, 0, 0.1, -820);

        // Field divisions — hedgerows
        makeBox(200, 1.5, 2, hg, -100, 1, -380);
        makeBox(200, 1.5, 2, hg, 100, 1, -450);
        makeBox(2, 1.5, 200, hg, -200, 1, -500);
        makeBox(2, 1.5, 200, hg, 200, 1, -600);
        makeBox(300, 1.5, 2, hg, 0, 1, -550);
        makeBox(300, 1.5, 2, hg, 0, 1, -700);

        // Old Roman road north (Stanegate / road to Scotland)
        makeBox(10, 0.6, 600, ro, 0, 0.5, -600);

        // Border farmhouse
        makeBox(16, 8, 12, 0xCCBBAA, -80, 4, -440);
        makeBox(18, 4, 14, 0x887766, -80, 10, -440);    // roof
        // Farmhouse barn
        makeBox(24, 6, 12, 0xBBAA88, -60, 3, -440);

        // Border reiver peel tower (defensive tower characteristic of border)
        makeBox(8, 18, 8, 0x888877, 120, 9, -420);
        makeBox(10, 2, 10, 0x777766, 120, 19, -420);    // parapet
        // Battlements
        makeBox(8, 3, 1, 0x888877, 120, 21, -415);
        makeBox(8, 3, 1, 0x888877, 120, 21, -425);
        makeBox(1, 3, 8, 0x888877, 115, 21, -420);
        makeBox(1, 3, 8, 0x888877, 125, 21, -420);

        // Northern moorland / Solway plains
        makeBox(800, 0.5, 200, 0x9AAA6A, 0, 0.1, -1000);

        // Distant Scottish hills (low mounds on horizon)
        makeBox(200, 20, 60, 0x6B8A4A, -200, 10, -1100);
        makeBox(160, 15, 50, 0x5A7A3A, 100, 7.5, -1050);
        makeBox(180, 18, 55, 0x5F8040, -50, 9, -1150);
    }

    // ---------------------------------------------------------------
    // CITY BUILDINGS — Georgian and Victorian Carlisle streetscape
    // ---------------------------------------------------------------
    function buildCityBuildings() {
        var gb = 0xCC9966;   // Georgian brick / sandstone
        var vb = 0xBB8855;   // Victorian brick
        var rb = 0xAA7744;   // red brick
        var wn = 0x88AACC;   // window blue

        // --- GEORGIAN TERRACES (English Street / Botchergate) ---
        // North side of English Street
        makeBox(30, 14, 12, gb, -80, 7, 30);
        makeBox(30, 14, 12, gb, -45, 7, 30);
        makeBox(30, 12, 12, gb, -10, 7, 30);

        // South side
        makeBox(30, 14, 12, gb, -80, 7, 18);
        makeBox(30, 12, 12, gb, -45, 7, 18);
        makeBox(30, 14, 12, gb, -10, 7, 18);

        // Botchergate terraces
        makeBox(20, 12, 10, rb, 80, 6, -10);
        makeBox(20, 12, 10, rb, 105, 6, -10);
        makeBox(20, 12, 10, rb, 130, 6, -10);
        makeBox(20, 12, 10, rb, 80, 6, 15);
        makeBox(20, 12, 10, rb, 105, 6, 15);

        // --- CARLISLE RAILWAY STATION (Citadel Station, 1847) ---
        makeBox(80, 14, 30, vb, 80, 7, 120);            // main station building
        makeBox(82, 2, 32, 0xBB9955, 80, 15, 120);      // cornice
        // Station roof (train shed)
        makeBox(60, 10, 50, 0x99AACC, 80, 22, 130);     // glazed train shed
        makeBox(62, 2, 52, 0x777777, 80, 27.5, 130);    // shed ridge
        // Station towers
        makeCyl(5, 5, 20, 8, vb, 42, 10, 106);
        makeCyl(5, 5, 20, 8, vb, 118, 10, 106);
        makeCone(5, 8, 8, 0x8B4513, 42, 24, 106);
        makeCone(5, 8, 8, 0x8B4513, 118, 24, 106);
        // Platform canopies
        makeBox(60, 4, 16, 0x99AACC, 80, 12, 150);
        makeBox(60, 4, 16, 0x99AACC, 80, 12, 165);

        // --- TOWN HALL ---
        makeBox(28, 16, 18, gb, -30, 8, -30);
        makeBox(30, 2, 20, 0xAA8844, -30, 17, -30);     // cornice
        // Town hall clock tower
        makeBox(8, 24, 8, gb, -30, 12, -30);
        makeCyl(4, 4, 6, 8, 0xBBAA88, -30, 25, -30);    // clock drum
        makeCone(4, 8, 8, 0x8B4513, -30, 31, -30);       // spire

        // --- ST CUTHBERT'S CHURCH ---
        makeBox(20, 14, 12, gb, 90, 7, 50);
        makeBox(6, 22, 6, gb, 90, 11, 42);               // church tower
        makeCone(4, 8, 8, 0x8B4513, 90, 26, 42);         // spire

        // --- VICTORIAN CIVIC BUILDINGS ---
        makeBox(36, 16, 20, vb, 150, 8, -50);
        makeBox(36, 3, 22, 0x887755, 150, 18, -50);
        // Columns
        makeCyl(1, 1, 16, 8, 0xCCBBAA, 134, 8, -40);
        makeCyl(1, 1, 16, 8, 0xCCBBAA, 166, 8, -40);

        // Assorted townhouses filling street
        makeBox(16, 10, 10, rb, -150, 5, 10);
        makeBox(16, 12, 10, gb, -170, 6, 10);
        makeBox(16, 10, 10, rb, -190, 5, 10);
        makeBox(16, 11, 10, vb, -210, 5.5, 10);

        makeBox(16, 10, 10, rb, -150, 5, -10);
        makeBox(16, 12, 10, gb, -170, 6, -10);
        makeBox(16, 10, 10, vb, -190, 5, -10);

        // Windows on main street buildings
        makeBox(3, 4, 1, wn, -80, 10, 24);
        makeBox(3, 4, 1, wn, -70, 10, 24);
        makeBox(3, 4, 1, wn, -45, 10, 24);
        makeBox(3, 4, 1, wn, -35, 10, 24);
        makeBox(3, 4, 1, wn, -10, 10, 24);
        makeBox(3, 4, 1, wn, 0, 10, 24);

        // --- ARTICULATED LAMP-POSTS (city street furniture) ---
        makeCyl(0.2, 0.2, 8, 6, 0x444444, -40, 4, 0);
        makeCyl(0.2, 0.2, 8, 6, 0x444444, 0, 4, 0);
        makeCyl(0.2, 0.2, 8, 6, 0x444444, 40, 4, 0);
        makeSphere(0.5, 6, 6, 0xFFFFCC, -40, 8.3, 0);
        makeSphere(0.5, 6, 6, 0xFFFFCC, 0, 8.3, 0);
        makeSphere(0.5, 6, 6, 0xFFFFCC, 40, 8.3, 0);
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };

}());
