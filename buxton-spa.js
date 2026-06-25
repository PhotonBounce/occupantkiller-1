window.BuxtonSpa = (function() {
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

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        buildMoorland();
        buildCrescent();
        buildOperaHouse();
        buildDevonshireDome();
        buildPavilionGardens();
        buildStAnnesWell();
        buildRiverWye();
        buildMarketPlace();
        buildPoolsCavern();
        buildGrinLowTower();
    }

    // ── Peak District moorland ──────────────────────────────────────────────
    function buildMoorland() {
        var matMoor = makeMat(0x8B7355);
        var matGrit = makeMat(0x6B5A3E);
        var matDark = makeMat(0x5C4A2A);

        // broad moorland base plateau — split into box slabs (no PlaneGeometry)
        var i, g, m, x, z;
        var slabs = [
            [-200, -2, -200, 400, 4, 80],
            [-200, -2,  120, 400, 4, 80],
            [-200, -2,  -80, 80,  4, 200],
            [ 120, -2,  -80, 80,  4, 200],
            [ -80, -2,  -80, 200, 4, 200]
        ];
        for (i = 0; i < slabs.length; i++) {
            g = new THREE.BoxGeometry(slabs[i][3], slabs[i][4], slabs[i][5]);
            m = new THREE.Mesh(g, matMoor);
            m.position.set(21800 + slabs[i][0], slabs[i][1], slabs[i][2]);
            addMesh(m);
        }

        // gritstone edge outcrops — rough stacked boxes on the hills
        var outcrops = [
            [180, 6, -180, 22, 12, 14],
            [160, 8, -200, 16, 16, 10],
            [195, 4, -160, 12, 8,  18],
            [-180, 6,  170, 20, 10, 12],
            [-160, 8,  190, 14, 14, 8],
            [190, 5,   170, 18, 10, 16],
            [170, 9,   190, 10, 18, 10]
        ];
        for (i = 0; i < outcrops.length; i++) {
            g = new THREE.BoxGeometry(outcrops[i][3], outcrops[i][4], outcrops[i][5]);
            m = new THREE.Mesh(g, matGrit);
            m.position.set(21800 + outcrops[i][0], outcrops[i][1], outcrops[i][2]);
            m.rotation.y = (i * 0.4);
            addMesh(m);
        }

        // small peat hummocks
        var hummocks = [
            [-150, 1, -150, 18, 3, 14],
            [-130, 1,  130, 16, 2, 12],
            [ 140, 1, -140, 20, 3, 16],
            [ 150, 1,  150, 14, 2, 10],
            [-170, 1,    0, 22, 4, 10],
            [   0, 1, -170, 10, 3, 22]
        ];
        for (i = 0; i < hummocks.length; i++) {
            g = new THREE.BoxGeometry(hummocks[i][3], hummocks[i][4], hummocks[i][5]);
            m = new THREE.Mesh(g, matDark);
            m.position.set(21800 + hummocks[i][0], hummocks[i][1], hummocks[i][2]);
            addMesh(m);
        }
    }

    // ── The Crescent ────────────────────────────────────────────────────────
    // Georgian semicircular terrace, Palladian, 7 ground-floor arches
    function buildCrescent() {
        var matCres = makeMat(0xF5F5DC);
        var matArch = makeMat(0xE8E0C8);
        var matWin  = makeMat(0x8AAABB);
        var i, g, m, angle, ax, az;

        // main curved terrace body — approximated as 7 angled box segments
        var numSegs = 7;
        var radius  = 42;
        for (i = 0; i < numSegs; i++) {
            angle = (Math.PI / (numSegs + 1)) * (i + 1); // spread π across 7 segments
            ax = -radius * Math.cos(angle);
            az = -radius * Math.sin(angle) + 20;

            // storey 1 — ground floor arch bay
            g = new THREE.BoxGeometry(11, 6, 8);
            m = new THREE.Mesh(g, matCres);
            m.position.set(21800 + ax, 3, az);
            m.rotation.y = angle - Math.PI / 2;
            addMesh(m);

            // storey 2 — piano nobile
            g = new THREE.BoxGeometry(11, 5, 7);
            m = new THREE.Mesh(g, matCres);
            m.position.set(21800 + ax, 8.5, az);
            m.rotation.y = angle - Math.PI / 2;
            addMesh(m);

            // storey 3 — upper floor
            g = new THREE.BoxGeometry(11, 4, 6);
            m = new THREE.Mesh(g, matCres);
            m.position.set(21800 + ax, 13, az);
            m.rotation.y = angle - Math.PI / 2;
            addMesh(m);

            // arch keystone / pilaster strip
            g = new THREE.BoxGeometry(1.5, 6, 1);
            m = new THREE.Mesh(g, matArch);
            var px = ax + Math.cos(angle) * -3.5;
            var pz = az + Math.sin(angle) * -3.5;
            m.position.set(21800 + px, 3, pz);
            m.rotation.y = angle - Math.PI / 2;
            addMesh(m);

            // sash window on piano nobile
            g = new THREE.BoxGeometry(2, 3, 0.4);
            m = new THREE.Mesh(g, matWin);
            m.position.set(21800 + ax, 8.5, az - 3.2);
            m.rotation.y = angle - Math.PI / 2;
            addMesh(m);
        }

        // parapet / balustrade across top
        g = new THREE.BoxGeometry(100, 1.5, 1.5);
        m = new THREE.Mesh(g, matCres);
        m.position.set(21800 - 2, 16, 20);
        addMesh(m);

        // central pediment
        g = new THREE.BoxGeometry(20, 3, 2);
        m = new THREE.Mesh(g, matCres);
        m.position.set(21800 - 2, 17.5, 20);
        addMesh(m);

        // triangular pediment top (approximated by flat box + cone)
        g = new THREE.BoxGeometry(20, 0.8, 1.5);
        m = new THREE.Mesh(g, matArch);
        m.position.set(21800 - 2, 19.2, 20);
        addMesh(m);
    }

    // ── Buxton Opera House ──────────────────────────────────────────────────
    // Edwardian baroque 1903, ornate terracotta facade, baroque dome
    function buildOperaHouse() {
        var matOp  = makeMat(0xD4C8A0);
        var matTer = makeMat(0xC8A882);
        var matDom = makeMat(0xB8A878);
        var matWin = makeMat(0x7A9BAA);
        var g, m;
        var ox = -30, oz = -50;

        // main auditorium body
        g = new THREE.BoxGeometry(30, 18, 24);
        m = new THREE.Mesh(g, matOp);
        m.position.set(21800 + ox, 9, oz);
        addMesh(m);

        // fly tower above stage
        g = new THREE.BoxGeometry(14, 28, 18);
        m = new THREE.Mesh(g, matOp);
        m.position.set(21800 + ox - 4, 14, oz - 3);
        addMesh(m);

        // baroque dome on top of auditorium
        g = new THREE.SphereGeometry(7, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        m = new THREE.Mesh(g, matDom);
        m.position.set(21800 + ox + 5, 19, oz + 3);
        addMesh(m);

        // dome drum
        g = new THREE.CylinderGeometry(7, 7.5, 4, 10);
        m = new THREE.Mesh(g, matDom);
        m.position.set(21800 + ox + 5, 17, oz + 3);
        addMesh(m);

        // facade / proscenium front
        g = new THREE.BoxGeometry(30, 20, 2);
        m = new THREE.Mesh(g, matTer);
        m.position.set(21800 + ox, 10, oz + 12);
        addMesh(m);

        // entrance portico columns (4)
        var colPos = [-9, -3, 3, 9];
        for (var ci = 0; ci < colPos.length; ci++) {
            g = new THREE.CylinderGeometry(0.6, 0.7, 9, 8);
            m = new THREE.Mesh(g, matTer);
            m.position.set(21800 + ox + colPos[ci], 4.5, oz + 13.5);
            addMesh(m);
        }

        // entablature over portico
        g = new THREE.BoxGeometry(26, 2, 2);
        m = new THREE.Mesh(g, matTer);
        m.position.set(21800 + ox, 10, oz + 13.5);
        addMesh(m);

        // ornate upper gable
        g = new THREE.BoxGeometry(26, 4, 1.5);
        m = new THREE.Mesh(g, matTer);
        m.position.set(21800 + ox, 13, oz + 13);
        addMesh(m);

        // windows on facade (6)
        var winX = [-10, -4, 2, 8, -10, 2];
        var winY = [  6,  6, 6, 6, 13, 13];
        for (var wi = 0; wi < winX.length; wi++) {
            g = new THREE.BoxGeometry(3, 4, 0.5);
            m = new THREE.Mesh(g, matWin);
            m.position.set(21800 + ox + winX[wi], winY[wi], oz + 12.5);
            addMesh(m);
        }
    }

    // ── The Devonshire Dome ─────────────────────────────────────────────────
    // Huge Victorian dome, once largest unsupported dome, now Univ of Derby
    function buildDevonshireDome() {
        var matDev  = makeMat(0xD4C8A0);
        var matDome = makeMat(0xC8BC90);
        var matBase = makeMat(0xBCAA7A);
        var g, m;
        var dx = 40, dz = -40;

        // massive main building block
        g = new THREE.BoxGeometry(55, 14, 55);
        m = new THREE.Mesh(g, matDev);
        m.position.set(21800 + dx, 7, dz);
        addMesh(m);

        // octagonal drum base for dome
        g = new THREE.CylinderGeometry(18, 19, 8, 8);
        m = new THREE.Mesh(g, matBase);
        m.position.set(21800 + dx, 17, dz);
        addMesh(m);

        // the great dome
        g = new THREE.SphereGeometry(18, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2);
        m = new THREE.Mesh(g, matDome);
        m.position.set(21800 + dx, 25, dz);
        addMesh(m);

        // dome lantern
        g = new THREE.CylinderGeometry(2.5, 3, 5, 8);
        m = new THREE.Mesh(g, matDome);
        m.position.set(21800 + dx, 43, dz);
        addMesh(m);

        // lantern cap (cone)
        g = new THREE.ConeGeometry(2.5, 3, 8);
        m = new THREE.Mesh(g, matDome);
        m.position.set(21800 + dx, 47, dz);
        addMesh(m);

        // corner pavilions (4 corners of the square building)
        var corners = [
            [-22, -22],
            [ 22, -22],
            [-22,  22],
            [ 22,  22]
        ];
        for (var ci = 0; ci < corners.length; ci++) {
            g = new THREE.BoxGeometry(12, 18, 12);
            m = new THREE.Mesh(g, matDev);
            m.position.set(21800 + dx + corners[ci][0], 9, dz + corners[ci][1]);
            addMesh(m);

            // pavilion roof
            g = new THREE.ConeGeometry(8, 6, 4);
            m = new THREE.Mesh(g, matBase);
            m.position.set(21800 + dx + corners[ci][0], 21, dz + corners[ci][1]);
            m.rotation.y = Math.PI / 4;
            addMesh(m);
        }

        // entrance arch
        g = new THREE.BoxGeometry(10, 14, 3);
        m = new THREE.Mesh(g, matBase);
        m.position.set(21800 + dx, 7, dz + 29);
        addMesh(m);
    }

    // ── Pavilion Gardens ────────────────────────────────────────────────────
    // Large Victorian park beside River Wye: conservatory, bandstand, paths
    function buildPavilionGardens() {
        var matGrass = makeMat(0x4CAF50);
        var matPath  = makeMat(0xD2B48C);
        var matGlass = makeMat(0x88CCDD);
        var matIron  = makeMat(0x445544);
        var g, m, i;
        var gx = -10, gz = 60;

        // lawn areas (several box-slab grass patches)
        var lawns = [
            [  0,  0, 50, 0.5, 40],
            [ 55,  0, 40, 0.5, 50],
            [-50,  0, 45, 0.5, 35],
            [  0,  0,-30, 0.5, 30]
        ];
        for (i = 0; i < lawns.length; i++) {
            g = new THREE.BoxGeometry(lawns[i][2], lawns[i][3], lawns[i][4]);
            m = new THREE.Mesh(g, matGrass);
            m.position.set(21800 + gx + lawns[i][0], 0.25, gz + lawns[i][1]);
            addMesh(m);
        }

        // gravel paths (pale tan boxes)
        var paths = [
            [  0, 3,  0, 0.3, 80],
            [  0, 3, 90, 0.3, 20],
            [-30, 3, 30, 0.3, 60]
        ];
        for (i = 0; i < paths.length; i++) {
            g = new THREE.BoxGeometry(paths[i][0] === 0 ? 3 : paths[i][2], paths[i][3], paths[i][4]);
            m = new THREE.Mesh(g, matPath);
            // simplified: lay horizontal path strips
            g = new THREE.BoxGeometry(3, 0.3, paths[i][4]);
            m = new THREE.Mesh(g, matPath);
            m.position.set(21800 + gx + paths[i][0], 0.35, gz + paths[i][1]);
            addMesh(m);
        }

        // Victorian conservatory (glass pavilion)
        // main hall
        g = new THREE.BoxGeometry(22, 8, 12);
        m = new THREE.Mesh(g, matGlass);
        m.position.set(21800 + gx + 20, 4, gz + 10);
        addMesh(m);

        // conservatory pitched roof
        g = new THREE.BoxGeometry(22, 1, 14);
        m = new THREE.Mesh(g, matIron);
        m.position.set(21800 + gx + 20, 8.2, gz + 10);
        addMesh(m);

        // roof ridge beam
        g = new THREE.BoxGeometry(24, 1, 1);
        m = new THREE.Mesh(g, matIron);
        m.position.set(21800 + gx + 20, 10, gz + 10);
        addMesh(m);

        // conservatory side wings
        g = new THREE.BoxGeometry(10, 6, 10);
        m = new THREE.Mesh(g, matGlass);
        m.position.set(21800 + gx + 31, 3, gz + 10);
        addMesh(m);

        g = new THREE.BoxGeometry(10, 6, 10);
        m = new THREE.Mesh(g, matGlass);
        m.position.set(21800 + gx + 9, 3, gz + 10);
        addMesh(m);

        // Victorian bandstand — octagonal platform + roof
        // platform
        g = new THREE.CylinderGeometry(7, 7.5, 1.2, 8);
        m = new THREE.Mesh(g, matPath);
        m.position.set(21800 + gx - 20, 0.6, gz + 40);
        addMesh(m);

        // bandstand columns (8)
        for (i = 0; i < 8; i++) {
            var bangle = (Math.PI * 2 / 8) * i;
            g = new THREE.CylinderGeometry(0.3, 0.3, 6, 6);
            m = new THREE.Mesh(g, matIron);
            m.position.set(
                21800 + gx - 20 + Math.cos(bangle) * 6,
                3.8,
                gz + 40 + Math.sin(bangle) * 6
            );
            addMesh(m);
        }

        // bandstand roof (cone)
        g = new THREE.ConeGeometry(8, 5, 8);
        m = new THREE.Mesh(g, matIron);
        m.position.set(21800 + gx - 20, 9.5, gz + 40);
        addMesh(m);

        // ornamental fountain in gardens
        g = new THREE.CylinderGeometry(4, 4.5, 0.8, 12);
        m = new THREE.Mesh(g, matPath);
        m.position.set(21800 + gx + 50, 0.4, gz + 50);
        addMesh(m);

        g = new THREE.CylinderGeometry(0.4, 0.4, 6, 6);
        m = new THREE.Mesh(g, matIron);
        m.position.set(21800 + gx + 50, 3, gz + 50);
        addMesh(m);

        g = new THREE.SphereGeometry(1.2, 8, 6);
        m = new THREE.Mesh(g, matIron);
        m.position.set(21800 + gx + 50, 7, gz + 50);
        addMesh(m);

        // park gate pillars (pair)
        g = new THREE.BoxGeometry(2, 6, 2);
        m = new THREE.Mesh(g, matPath);
        m.position.set(21800 + gx - 6, 3, gz - 8);
        addMesh(m);

        g = new THREE.BoxGeometry(2, 6, 2);
        m = new THREE.Mesh(g, matPath);
        m.position.set(21800 + gx + 6, 3, gz - 8);
        addMesh(m);
    }

    // ── St Anne's Well ──────────────────────────────────────────────────────
    // Thermal spring source, stone basin
    function buildStAnnesWell() {
        var matStone = makeMat(0xF5F0E8);
        var matWater = makeMat(0x5599AA);
        var matDark  = makeMat(0xBBB0A0);
        var g, m;
        var wx = -50, wz = 10;

        // stone wellhouse
        g = new THREE.BoxGeometry(8, 6, 8);
        m = new THREE.Mesh(g, matStone);
        m.position.set(21800 + wx, 3, wz);
        addMesh(m);

        // wellhouse roof (hipped — approximated as cone on box)
        g = new THREE.ConeGeometry(6.5, 4, 4);
        m = new THREE.Mesh(g, matDark);
        m.position.set(21800 + wx, 8, wz);
        m.rotation.y = Math.PI / 4;
        addMesh(m);

        // spring basin
        g = new THREE.CylinderGeometry(3, 3.2, 0.6, 10);
        m = new THREE.Mesh(g, matStone);
        m.position.set(21800 + wx, 0.3, wz);
        addMesh(m);

        // water in basin
        g = new THREE.CylinderGeometry(2.6, 2.6, 0.3, 10);
        m = new THREE.Mesh(g, matWater);
        m.position.set(21800 + wx, 0.55, wz);
        addMesh(m);

        // small classical pediment above well opening
        g = new THREE.BoxGeometry(6, 1.5, 0.8);
        m = new THREE.Mesh(g, matStone);
        m.position.set(21800 + wx, 6.5, wz + 4);
        addMesh(m);

        // stone surround wall
        g = new THREE.BoxGeometry(12, 1, 12);
        m = new THREE.Mesh(g, matStone);
        m.position.set(21800 + wx, 0.1, wz);
        addMesh(m);

        // inscription plaque
        g = new THREE.BoxGeometry(3, 2, 0.3);
        m = new THREE.Mesh(g, matDark);
        m.position.set(21800 + wx, 3.5, wz + 4.1);
        addMesh(m);
    }

    // ── River Wye ──────────────────────────────────────────────────────────
    // Small river winding through the gardens
    function buildRiverWye() {
        var matRiv   = makeMat(0x4682B4);
        var matBank  = makeMat(0x7B9B5A);
        var matStone = makeMat(0x999080);
        var g, m, i;

        // river course in 5 sections (winding slightly)
        var riverSegs = [
            [-10, 50,  6, 22],
            [ -8, 30,  6, 22],
            [ -6, 10,  5, 22],
            [ -4,-10,  5, 22],
            [ -2,-30,  5, 22]
        ];
        for (i = 0; i < riverSegs.length; i++) {
            g = new THREE.BoxGeometry(riverSegs[i][2], 0.4, riverSegs[i][3]);
            m = new THREE.Mesh(g, matRiv);
            m.position.set(21800 + riverSegs[i][0], 0.2, riverSegs[i][1]);
            addMesh(m);

            // grassy bank alongside
            g = new THREE.BoxGeometry(riverSegs[i][2] + 3, 0.5, riverSegs[i][3]);
            m = new THREE.Mesh(g, matBank);
            m.position.set(21800 + riverSegs[i][0] - 4.5, 0.2, riverSegs[i][1]);
            addMesh(m);
        }

        // small stone footbridge over river
        g = new THREE.BoxGeometry(9, 0.8, 4);
        m = new THREE.Mesh(g, matStone);
        m.position.set(21800 - 8, 0.8, 20);
        addMesh(m);

        // bridge parapets
        g = new THREE.BoxGeometry(9, 1.2, 0.4);
        m = new THREE.Mesh(g, matStone);
        m.position.set(21800 - 8, 1.5, 18);
        addMesh(m);

        g = new THREE.BoxGeometry(9, 1.2, 0.4);
        m = new THREE.Mesh(g, matStone);
        m.position.set(21800 - 8, 1.5, 22);
        addMesh(m);

        // bridge arch piers (2 pairs)
        g = new THREE.BoxGeometry(1.5, 2, 4);
        m = new THREE.Mesh(g, matStone);
        m.position.set(21800 - 11, 0.5, 20);
        addMesh(m);

        g = new THREE.BoxGeometry(1.5, 2, 4);
        m = new THREE.Mesh(g, matStone);
        m.position.set(21800 - 5, 0.5, 20);
        addMesh(m);
    }

    // ── Buxton Market Place ─────────────────────────────────────────────────
    // Central market hall, old Town Hall
    function buildMarketPlace() {
        var matMkt  = makeMat(0xDEB887);
        var matTH   = makeMat(0xCCAA77);
        var matRoof = makeMat(0x886644);
        var matWin  = makeMat(0x99BBCC);
        var g, m, i;
        var mx = -60, mz = -60;

        // market hall main body
        g = new THREE.BoxGeometry(26, 10, 16);
        m = new THREE.Mesh(g, matMkt);
        m.position.set(21800 + mx, 5, mz);
        addMesh(m);

        // market hall roof — pitched
        g = new THREE.BoxGeometry(28, 2, 18);
        m = new THREE.Mesh(g, matRoof);
        m.position.set(21800 + mx, 11.5, mz);
        addMesh(m);

        // market hall ridge
        g = new THREE.BoxGeometry(26, 2, 1);
        m = new THREE.Mesh(g, matRoof);
        m.position.set(21800 + mx, 13, mz);
        addMesh(m);

        // arched open market bays (5 arches along front)
        for (i = 0; i < 5; i++) {
            g = new THREE.BoxGeometry(4, 6, 0.6);
            m = new THREE.Mesh(g, matWin);
            m.position.set(21800 + mx - 10 + i * 5, 3, mz + 8);
            addMesh(m);
        }

        // town hall
        g = new THREE.BoxGeometry(18, 14, 12);
        m = new THREE.Mesh(g, matTH);
        m.position.set(21800 + mx + 28, 7, mz);
        addMesh(m);

        // town hall clock tower
        g = new THREE.BoxGeometry(5, 22, 5);
        m = new THREE.Mesh(g, matTH);
        m.position.set(21800 + mx + 28, 11, mz + 3);
        addMesh(m);

        // clock tower cap
        g = new THREE.ConeGeometry(4, 6, 4);
        m = new THREE.Mesh(g, matRoof);
        m.position.set(21800 + mx + 28, 26, mz + 3);
        m.rotation.y = Math.PI / 4;
        addMesh(m);

        // clock face (flat disc approximated as thin cylinder)
        g = new THREE.CylinderGeometry(2, 2, 0.3, 12);
        m = new THREE.Mesh(g, matWin);
        m.rotation.z = Math.PI / 2;
        m.position.set(21800 + mx + 28, 20, mz + 6);
        addMesh(m);

        // town hall front columns (4)
        var colsX = [-5, -1.5, 1.5, 5];
        for (i = 0; i < colsX.length; i++) {
            g = new THREE.CylinderGeometry(0.5, 0.6, 10, 8);
            m = new THREE.Mesh(g, matTH);
            m.position.set(21800 + mx + 28 + colsX[i], 5, mz + 6.5);
            addMesh(m);
        }

        // market cobblestone square (ground)
        g = new THREE.BoxGeometry(60, 0.4, 45);
        m = new THREE.Mesh(g, matMkt);
        m.position.set(21800 + mx + 14, 0.1, mz);
        addMesh(m);

        // market stall awnings (3)
        var stallPos = [-20, -10, 0];
        for (i = 0; i < stallPos.length; i++) {
            g = new THREE.BoxGeometry(6, 0.5, 4);
            m = new THREE.Mesh(g, makeMat(0xCC4444));
            m.position.set(21800 + mx + stallPos[i] + 14, 3.5, mz + 12);
            addMesh(m);
        }
    }

    // ── Poole's Cavern ──────────────────────────────────────────────────────
    // Dramatic limestone cave entrance on a hillside
    function buildPoolsCavern() {
        var matLime  = makeMat(0x555555);
        var matDark  = makeMat(0x333333);
        var matHill  = makeMat(0x6B7355);
        var matVeg   = makeMat(0x4A6040);
        var g, m, i;
        var cx = -100, cz = -90;

        // hillside body
        g = new THREE.BoxGeometry(50, 28, 45);
        m = new THREE.Mesh(g, matHill);
        m.position.set(21800 + cx, 14, cz);
        addMesh(m);

        // limestone cliff face
        g = new THREE.BoxGeometry(36, 22, 5);
        m = new THREE.Mesh(g, matLime);
        m.position.set(21800 + cx, 11, cz + 22);
        addMesh(m);

        // cave entrance void — dark recessed box
        g = new THREE.BoxGeometry(8, 7, 4);
        m = new THREE.Mesh(g, matDark);
        m.position.set(21800 + cx, 5.5, cz + 23);
        addMesh(m);

        // cave entrance arch lintel
        g = new THREE.BoxGeometry(10, 2, 3);
        m = new THREE.Mesh(g, matLime);
        m.position.set(21800 + cx, 10, cz + 23);
        addMesh(m);

        // stalactite suggestions at entrance (3 hanging boxes)
        var stalX = [-2, 0, 2];
        for (i = 0; i < stalX.length; i++) {
            g = new THREE.BoxGeometry(0.6, 2.5, 0.6);
            m = new THREE.Mesh(g, matLime);
            m.position.set(21800 + cx + stalX[i], 8, cz + 23.5);
            addMesh(m);
        }

        // rocky debris at base of cliff
        var debris = [
            [-10, 0.8, 10, 3, 1.5, 2.5],
            [  6, 0.7,  8, 2.5, 1.2, 2],
            [ -4, 0.6, 14, 2,   1,   3],
            [ 12, 0.9,  6, 4,   1.8, 2.5]
        ];
        for (i = 0; i < debris.length; i++) {
            g = new THREE.BoxGeometry(debris[i][3], debris[i][4], debris[i][5]);
            m = new THREE.Mesh(g, matLime);
            m.position.set(21800 + cx + debris[i][0], debris[i][1], cz + 24 + debris[i][2]);
            m.rotation.y = i * 0.7;
            addMesh(m);
        }

        // woodland on hillside — 5 tree stumps/trunks
        var treePos = [[-12, 10], [8, 6], [-6, -8], [14, -4], [-16, -2]];
        for (i = 0; i < treePos.length; i++) {
            // trunk
            g = new THREE.CylinderGeometry(0.6, 0.8, 7, 6);
            m = new THREE.Mesh(g, makeMat(0x5C4A30));
            m.position.set(21800 + cx + treePos[i][0], 17, cz + treePos[i][1]);
            addMesh(m);

            // canopy
            g = new THREE.SphereGeometry(3.5, 6, 5);
            m = new THREE.Mesh(g, matVeg);
            m.position.set(21800 + cx + treePos[i][0], 23, cz + treePos[i][1]);
            addMesh(m);
        }

        // visitor centre small building
        g = new THREE.BoxGeometry(12, 5, 8);
        m = new THREE.Mesh(g, makeMat(0xAA9977));
        m.position.set(21800 + cx + 18, 2.5, cz + 30);
        addMesh(m);

        g = new THREE.BoxGeometry(14, 1, 10);
        m = new THREE.Mesh(g, makeMat(0x887755));
        m.position.set(21800 + cx + 18, 5.5, cz + 30);
        addMesh(m);
    }

    // ── Grin Low Tower (Solomon's Temple) ──────────────────────────────────
    // Victorian folly tower on hilltop above Poole's Cavern
    function buildGrinLowTower() {
        var matTow  = makeMat(0xAAAAAA);
        var matDark = makeMat(0x888888);
        var matCap  = makeMat(0x999999);
        var matHill = makeMat(0x7A6B55);
        var g, m, i;
        var tx = -90, tz = -140;

        // Grin Low hilltop
        g = new THREE.BoxGeometry(60, 20, 60);
        m = new THREE.Mesh(g, matHill);
        m.position.set(21800 + tx, 10, tz);
        addMesh(m);

        // hilltop cap
        g = new THREE.CylinderGeometry(22, 28, 8, 8);
        m = new THREE.Mesh(g, matHill);
        m.position.set(21800 + tx, 23, tz);
        addMesh(m);

        // tower base plinth
        g = new THREE.BoxGeometry(8, 2, 8);
        m = new THREE.Mesh(g, matDark);
        m.position.set(21800 + tx, 28, tz);
        addMesh(m);

        // tower main shaft
        g = new THREE.CylinderGeometry(3, 3.5, 16, 8);
        m = new THREE.Mesh(g, matTow);
        m.position.set(21800 + tx, 37, tz);
        addMesh(m);

        // tower battlemented parapet — 4 merlons around top
        for (i = 0; i < 4; i++) {
            var ta = (Math.PI / 2) * i;
            g = new THREE.BoxGeometry(2.5, 3, 2.5);
            m = new THREE.Mesh(g, matTow);
            m.position.set(
                21800 + tx + Math.cos(ta) * 3.5,
                46.5,
                tz + Math.sin(ta) * 3.5
            );
            addMesh(m);
        }

        // viewing platform ring
        g = new THREE.CylinderGeometry(4.5, 4.5, 1, 8);
        m = new THREE.Mesh(g, matDark);
        m.position.set(21800 + tx, 45, tz);
        addMesh(m);

        // flagpole
        g = new THREE.CylinderGeometry(0.15, 0.15, 6, 4);
        m = new THREE.Mesh(g, matDark);
        m.position.set(21800 + tx, 51, tz);
        addMesh(m);

        // flag (small flat box)
        g = new THREE.BoxGeometry(3, 1.5, 0.1);
        m = new THREE.Mesh(g, makeMat(0xFF0000));
        m.position.set(21800 + tx + 1.5, 53.5, tz);
        addMesh(m);

        // access path up the hill
        var pathSegs = 4;
        for (i = 0; i < pathSegs; i++) {
            g = new THREE.BoxGeometry(2.5, 0.5, 10);
            m = new THREE.Mesh(g, makeMat(0xC8B89A));
            m.position.set(21800 + tx + i * 1.5, 21 + i * 1.8, tz + 28 - i * 9);
            addMesh(m);
        }

        // trig point pillar at summit
        g = new THREE.CylinderGeometry(0.5, 0.6, 1.2, 4);
        m = new THREE.Mesh(g, matCap);
        m.position.set(21800 + tx + 6, 27.6, tz + 8);
        addMesh(m);
    }

    function update(delta) {
        // static environment — no per-frame logic needed
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
