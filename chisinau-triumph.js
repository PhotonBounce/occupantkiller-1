window.ChisinauTriumph = (function() {
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

    function addMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildTriumphalArch();
        buildNativityCathedral();
        buildParliament();
        buildGovernmentHouse();
        buildCentralPark();
        buildHistoryMuseum();
        buildRailwayStation();
        buildOldMarket();
        buildCircus();
        buildBicRiver();
    }

    // ── TRIUMPHAL ARCH ──────────────────────────────────────────────────────
    // Base center: x=23560, z=0
    function buildTriumphalArch() {
        var cx = 23560, cz = 0;
        var archColor = 0xD4C8A0;
        var detailColor = 0xC2B68E;

        // Left pylon
        addMesh(new THREE.BoxGeometry(4, 14, 5), archColor, cx - 5, 7, cz);
        // Right pylon
        addMesh(new THREE.BoxGeometry(4, 14, 5), archColor, cx + 5, 7, cz);

        // Arch lintel / keystone top bar
        addMesh(new THREE.BoxGeometry(14, 3, 5), archColor, cx, 14.5, cz);

        // Keystone wedge above arch opening (CylinderGeometry as wedge shape)
        addMesh(new THREE.CylinderGeometry(1.2, 1.5, 2, 4), detailColor, cx, 17, cz);

        // Cornice / entablature strips on pylons
        addMesh(new THREE.BoxGeometry(4.6, 0.6, 5.6), detailColor, cx - 5, 14, cz);
        addMesh(new THREE.BoxGeometry(4.6, 0.6, 5.6), detailColor, cx + 5, 14, cz);

        // Bell tower shaft above keystone
        addMesh(new THREE.BoxGeometry(3, 8, 3), archColor, cx, 20, cz);

        // Bell tower belfry octagonal
        addMesh(new THREE.CylinderGeometry(2, 2.2, 3, 8), archColor, cx, 25.5, cz);

        // Bell tower conical roof
        addMesh(new THREE.ConeGeometry(2.3, 3.5, 8), detailColor, cx, 28.75, cz);

        // Neoclassical columns on left pylon (front & back)
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 11, 8), detailColor, cx - 3.2, 5.5, cz + 2.8);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 11, 8), detailColor, cx - 6.8, 5.5, cz + 2.8);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 11, 8), detailColor, cx - 3.2, 5.5, cz - 2.8);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 11, 8), detailColor, cx - 6.8, 5.5, cz - 2.8);

        // Neoclassical columns on right pylon
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 11, 8), detailColor, cx + 3.2, 5.5, cz + 2.8);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 11, 8), detailColor, cx + 6.8, 5.5, cz + 2.8);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 11, 8), detailColor, cx + 3.2, 5.5, cz - 2.8);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 11, 8), detailColor, cx + 6.8, 5.5, cz - 2.8);

        // Base plinth
        addMesh(new THREE.BoxGeometry(16, 1.2, 7), detailColor, cx, 0.6, cz);

        // Steps
        addMesh(new THREE.BoxGeometry(18, 0.4, 8), 0xBCAE90, cx, 1.2, cz);
        addMesh(new THREE.BoxGeometry(20, 0.4, 9), 0xBCAE90, cx, 0.4, cz);
    }

    // ── NATIVITY CATHEDRAL ──────────────────────────────────────────────────
    function buildNativityCathedral() {
        var cx = 23560, cz = -80;
        var wallColor = 0xF0EDE8;
        var domeColor = 0xE8E4DC;
        var goldColor = 0xCCAA44;

        // Main nave body
        addMesh(new THREE.BoxGeometry(30, 18, 20), wallColor, cx, 9, cz);

        // Apse (rear extension)
        addMesh(new THREE.BoxGeometry(12, 14, 10), wallColor, cx, 7, cz + 15);

        // Portico / colonnaded front
        addMesh(new THREE.BoxGeometry(28, 10, 6), wallColor, cx, 5, cz - 13);

        // Portico columns (6 front columns)
        var colX = cx - 12;
        for (var i = 0; i < 6; i++) {
            addMesh(new THREE.CylinderGeometry(0.6, 0.7, 10, 10), 0xEAE6E0, colX + i * 4.8, 5, cz - 15.5);
        }

        // Portico triangular pediment
        addMesh(new THREE.ConeGeometry(14, 4, 3), wallColor, cx, 12.5, cz - 13);

        // Main dome (central, largest)
        addMesh(new THREE.SphereGeometry(5.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), domeColor, cx, 18, cz);
        addMesh(new THREE.CylinderGeometry(5.5, 5.5, 4, 16), wallColor, cx, 16, cz);
        // Dome lantern
        addMesh(new THREE.CylinderGeometry(1.2, 1.5, 3, 8), wallColor, cx, 24, cz);
        addMesh(new THREE.SphereGeometry(1.3, 8, 6), goldColor, cx, 27, cz);

        // 4 corner domes
        var domeOffsets = [[-10, -8], [10, -8], [-10, 8], [10, 8]];
        for (var d = 0; d < 4; d++) {
            var dx = domeOffsets[d][0], dz = domeOffsets[d][1];
            addMesh(new THREE.CylinderGeometry(2, 2, 3, 12), wallColor, cx + dx, 18, cz + dz);
            addMesh(new THREE.SphereGeometry(2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), domeColor, cx + dx, 21, cz + dz);
            addMesh(new THREE.SphereGeometry(0.5, 6, 4), goldColor, cx + dx, 23.5, cz + dz);
        }

        // Bell tower (separate, to the left)
        addMesh(new THREE.BoxGeometry(8, 30, 8), wallColor, cx - 25, 15, cz);
        addMesh(new THREE.BoxGeometry(8.8, 0.8, 8.8), domeColor, cx - 25, 30.4, cz);
        addMesh(new THREE.CylinderGeometry(4.5, 4.5, 5, 12), wallColor, cx - 25, 33, cz);
        addMesh(new THREE.ConeGeometry(4.8, 7, 12), domeColor, cx - 25, 38, cz);

        // Park lawn around cathedral
        addMesh(new THREE.BoxGeometry(80, 0.3, 60), 0x3D7A32, cx, 0.15, cz);

        // Park trees (cylinders + cones)
        var treePositions = [
            [-30, -35], [30, -35], [-30, 35], [30, 35],
            [-38, 0], [38, 0], [0, -38], [0, 38]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tx = treePositions[t][0], tz = treePositions[t][1];
            addMesh(new THREE.CylinderGeometry(0.4, 0.5, 4, 7), 0x5C3D1E, cx + tx, 2, cz + tz);
            addMesh(new THREE.ConeGeometry(2.5, 6, 7), 0x2D6A1E, cx + tx, 7, cz + tz);
        }

        // Park path (flat box)
        addMesh(new THREE.BoxGeometry(5, 0.1, 50), 0xC8BCA0, cx, 0.35, cz);
        addMesh(new THREE.BoxGeometry(50, 0.1, 5), 0xC8BCA0, cx, 0.35, cz);
    }

    // ── PARLIAMENT ──────────────────────────────────────────────────────────
    function buildParliament() {
        var cx = 23560 + 60, cz = 50;
        var wallColor = 0x888899;
        var darkColor = 0x6A6A7A;

        // Main Brutalist block
        addMesh(new THREE.BoxGeometry(50, 24, 28), wallColor, cx, 12, cz);

        // Roof parapet / top band
        addMesh(new THREE.BoxGeometry(52, 2, 30), darkColor, cx, 25, cz);

        // Front colonnade recessed
        addMesh(new THREE.BoxGeometry(40, 18, 4), darkColor, cx, 9, cz - 16);

        // Central raised entrance block
        addMesh(new THREE.BoxGeometry(16, 28, 8), wallColor, cx, 14, cz - 14);

        // Entrance steps
        addMesh(new THREE.BoxGeometry(18, 0.5, 4), 0x777788, cx, 0.25, cz - 18);
        addMesh(new THREE.BoxGeometry(20, 0.5, 4), 0x777788, cx, 0, cz - 20);

        // Flagpoles (3) — cylinder shafts
        addMesh(new THREE.CylinderGeometry(0.12, 0.12, 12, 6), 0xAAAAAA, cx - 6, 6, cz - 18);
        addMesh(new THREE.CylinderGeometry(0.12, 0.12, 14, 6), 0xAAAAAA, cx, 7, cz - 18);
        addMesh(new THREE.CylinderGeometry(0.12, 0.12, 12, 6), 0xAAAAAA, cx + 6, 6, cz - 18);

        // Flags (small flat boxes in blue/yellow/red = Moldova tricolor)
        addMesh(new THREE.BoxGeometry(2.5, 0.05, 1.5), 0x003DA5, cx - 5.2, 11, cz - 18);
        addMesh(new THREE.BoxGeometry(2.5, 0.05, 1.5), 0xFFD100, cx + 0.8, 13, cz - 18);
        addMesh(new THREE.BoxGeometry(2.5, 0.05, 1.5), 0xCC0001, cx + 6.8, 11, cz - 18);

        // Side wings
        addMesh(new THREE.BoxGeometry(14, 18, 28), wallColor, cx - 32, 9, cz);
        addMesh(new THREE.BoxGeometry(14, 18, 28), wallColor, cx + 32, 9, cz);

        // Horizontal window bands
        addMesh(new THREE.BoxGeometry(48, 1.2, 0.3), 0x555566, cx, 8, cz - 14);
        addMesh(new THREE.BoxGeometry(48, 1.2, 0.3), 0x555566, cx, 14, cz - 14);
        addMesh(new THREE.BoxGeometry(48, 1.2, 0.3), 0x555566, cx, 20, cz - 14);

        // Forecourt / plaza
        addMesh(new THREE.BoxGeometry(60, 0.2, 30), 0x9090A0, cx, 0.1, cz - 25);
    }

    // ── GOVERNMENT HOUSE ────────────────────────────────────────────────────
    function buildGovernmentHouse() {
        var cx = 23560 - 60, cz = 50;
        var wallColor = 0xC8C8C0;
        var trimColor = 0xB0B0A8;

        // Main Stalinist neoclassical block
        addMesh(new THREE.BoxGeometry(48, 22, 26), wallColor, cx, 11, cz);

        // Central tower / risalit
        addMesh(new THREE.BoxGeometry(18, 32, 26), wallColor, cx, 16, cz);

        // Stalinist spire above tower
        addMesh(new THREE.BoxGeometry(8, 6, 8), trimColor, cx, 33, cz);
        addMesh(new THREE.CylinderGeometry(2, 4, 8, 8), trimColor, cx, 40, cz);
        addMesh(new THREE.ConeGeometry(2, 6, 8), 0xBBBBB0, cx, 47, cz);

        // Classical columns on front face
        for (var c = 0; c < 5; c++) {
            addMesh(new THREE.CylinderGeometry(0.55, 0.65, 22, 10), 0xD4D4CC, cx - 8 + c * 4, 11, cz - 13);
        }

        // Entablature (cornice band)
        addMesh(new THREE.BoxGeometry(50, 1.5, 28), trimColor, cx, 22.75, cz);

        // Attic story
        addMesh(new THREE.BoxGeometry(46, 6, 24), trimColor, cx, 26, cz);

        // Wings projections
        addMesh(new THREE.BoxGeometry(10, 18, 26), wallColor, cx - 29, 9, cz);
        addMesh(new THREE.BoxGeometry(10, 18, 26), wallColor, cx + 29, 9, cz);

        // Steps & entrance
        addMesh(new THREE.BoxGeometry(20, 0.5, 4), 0xB8B8B0, cx, 0.25, cz - 15);
        addMesh(new THREE.BoxGeometry(22, 0.5, 4), 0xB8B8B0, cx, 0, cz - 17);

        // Flagpoles on roof
        addMesh(new THREE.CylinderGeometry(0.1, 0.1, 10, 5), 0xAAAAAA, cx - 4, 28, cz);
        addMesh(new THREE.CylinderGeometry(0.1, 0.1, 10, 5), 0xAAAAAA, cx + 4, 28, cz);
        addMesh(new THREE.BoxGeometry(2, 0.05, 1.2), 0x003DA5, cx - 3.5, 32.5, cz);
        addMesh(new THREE.BoxGeometry(2, 0.05, 1.2), 0xCC0001, cx + 4.5, 32.5, cz);
    }

    // ── CENTRAL PARK (GRĂDINA PUBLICĂ ȘTEFAN CEL MARE) ───────────────────
    function buildCentralPark() {
        var cx = 23560, cz = 100;
        var grassColor = 0x3D7A32;
        var pathColor = 0xC0B890;
        var stoneColor = 0xA0906C;

        // Main lawn
        addMesh(new THREE.BoxGeometry(90, 0.3, 70), grassColor, cx, 0.15, cz);

        // Main alley path cross
        addMesh(new THREE.BoxGeometry(6, 0.1, 70), pathColor, cx, 0.35, cz);
        addMesh(new THREE.BoxGeometry(90, 0.1, 6), pathColor, cx, 0.35, cz);

        // Ștefan the Great statue — pedestal + figure
        addMesh(new THREE.BoxGeometry(3, 1.5, 3), stoneColor, cx, 0.75, cz - 10);
        addMesh(new THREE.BoxGeometry(2.2, 5, 2.2), stoneColor, cx, 4.25, cz - 10);
        // Statue figure (cylinder body + sphere head)
        addMesh(new THREE.CylinderGeometry(0.5, 0.7, 3.5, 8), 0x706050, cx, 8.25, cz - 10);
        addMesh(new THREE.SphereGeometry(0.5, 8, 6), 0x706050, cx, 10.25, cz - 10);

        // Fountain basin + jet
        addMesh(new THREE.CylinderGeometry(5, 5.5, 0.8, 16), 0x6A8A9A, cx + 15, 0.4, cz);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 8), 0x8ABCCC, cx + 15, 2.8, cz);
        addMesh(new THREE.SphereGeometry(1.2, 8, 6), 0x8ABCCC, cx + 15, 5.4, cz);

        // Park benches (flat boxes)
        var benchPos = [
            [-15, -5], [-15, 5], [5, -20], [5, 20], [25, -10], [25, 10]
        ];
        for (var b = 0; b < benchPos.length; b++) {
            addMesh(new THREE.BoxGeometry(2.5, 0.3, 0.6), 0x8B6914, cx + benchPos[b][0], 0.45, cz + benchPos[b][1]);
            // bench legs
            addMesh(new THREE.BoxGeometry(0.15, 0.5, 0.6), 0x6B5010, cx + benchPos[b][0] - 0.9, 0.25, cz + benchPos[b][1]);
            addMesh(new THREE.BoxGeometry(0.15, 0.5, 0.6), 0x6B5010, cx + benchPos[b][0] + 0.9, 0.25, cz + benchPos[b][1]);
        }

        // Park trees grid
        var parkTrees = [
            [-35, -25], [-35, 25], [35, -25], [35, 25],
            [-35, 0], [35, 0], [0, -30], [0, 30],
            [-20, -28], [20, -28], [-20, 28], [20, 28],
            [-38, -10], [-38, 10], [38, -10], [38, 10]
        ];
        for (var pt = 0; pt < parkTrees.length; pt++) {
            var ptx = parkTrees[pt][0], ptz = parkTrees[pt][1];
            addMesh(new THREE.CylinderGeometry(0.35, 0.45, 5, 7), 0x4A2E10, cx + ptx, 2.5, cz + ptz);
            addMesh(new THREE.SphereGeometry(3, 8, 6), 0x2A6018, cx + ptx, 7.5, cz + ptz);
        }

        // Park fence posts (small cylinders along border)
        for (var fp = -40; fp <= 40; fp += 8) {
            addMesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 6), 0x2A2A2A, cx + fp, 1, cz + 35);
            addMesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 6), 0x2A2A2A, cx + fp, 1, cz - 35);
        }
    }

    // ── NATIONAL MUSEUM OF HISTORY ──────────────────────────────────────────
    function buildHistoryMuseum() {
        var cx = 23560 + 100, cz = -30;
        var wallColor = 0xD4C0A0;
        var trimColor = 0xC0A880;

        // Main museum block
        addMesh(new THREE.BoxGeometry(36, 18, 22), wallColor, cx, 9, cz);

        // Front portico
        addMesh(new THREE.BoxGeometry(24, 14, 6), wallColor, cx, 7, cz - 14);

        // Portico columns
        for (var pc = 0; pc < 5; pc++) {
            addMesh(new THREE.CylinderGeometry(0.5, 0.6, 14, 10), 0xD8C8A8, cx - 9 + pc * 4.5, 7, cz - 16);
        }

        // Pediment
        addMesh(new THREE.ConeGeometry(12, 4, 3), wallColor, cx, 16, cz - 14);

        // Roof balustrade
        addMesh(new THREE.BoxGeometry(38, 0.8, 24), trimColor, cx, 18.4, cz);

        // Side wings
        addMesh(new THREE.BoxGeometry(8, 14, 22), wallColor, cx - 22, 7, cz);
        addMesh(new THREE.BoxGeometry(8, 14, 22), wallColor, cx + 22, 7, cz);

        // Dacian figurine sculpture out front (pedestal + abstract figure)
        addMesh(new THREE.BoxGeometry(2, 1.2, 2), trimColor, cx - 5, 0.6, cz - 20);
        addMesh(new THREE.BoxGeometry(1.2, 4, 1.2), 0x9A8060, cx - 5, 3.2, cz - 20);
        addMesh(new THREE.SphereGeometry(0.6, 8, 6), 0x9A8060, cx - 5, 5.6, cz - 20);
        addMesh(new THREE.BoxGeometry(2, 0.2, 0.5), 0x9A8060, cx - 5, 3.5, cz - 20);

        // Museum entrance steps
        addMesh(new THREE.BoxGeometry(14, 0.5, 3), trimColor, cx, 0.25, cz - 18);
        addMesh(new THREE.BoxGeometry(16, 0.5, 3), trimColor, cx, 0, cz - 20);
    }

    // ── CHISINAU RAILWAY STATION ─────────────────────────────────────────────
    function buildRailwayStation() {
        var cx = 23560 - 100, cz = -50;
        var wallColor = 0xD4D0C8;
        var trimColor = 0xBCB8B0;
        var darkTrim = 0x888880;

        // Main station building
        addMesh(new THREE.BoxGeometry(55, 20, 25), wallColor, cx, 10, cz);

        // Central tower block (Stalinist risalit)
        addMesh(new THREE.BoxGeometry(20, 28, 25), wallColor, cx, 14, cz);

        // Tower attic
        addMesh(new THREE.BoxGeometry(18, 5, 23), trimColor, cx, 30.5, cz);

        // Tower crown spire
        addMesh(new THREE.CylinderGeometry(1.5, 3.5, 7, 8), trimColor, cx, 36, cz);
        addMesh(new THREE.ConeGeometry(1.5, 4, 8), darkTrim, cx, 41, cz);

        // Grand arched windows (recessed boxes)
        addMesh(new THREE.BoxGeometry(5, 9, 1), darkTrim, cx - 8, 12, cz - 12.5);
        addMesh(new THREE.BoxGeometry(5, 9, 1), darkTrim, cx, 14, cz - 12.5);
        addMesh(new THREE.BoxGeometry(5, 9, 1), darkTrim, cx + 8, 12, cz - 12.5);

        // Decorative columns on tower front
        addMesh(new THREE.CylinderGeometry(0.5, 0.6, 25, 8), 0xD8D4CC, cx - 6, 12.5, cz - 12.5);
        addMesh(new THREE.CylinderGeometry(0.5, 0.6, 25, 8), 0xD8D4CC, cx + 6, 12.5, cz - 12.5);

        // Station side wings (lower)
        addMesh(new THREE.BoxGeometry(16, 14, 22), wallColor, cx - 35, 7, cz);
        addMesh(new THREE.BoxGeometry(16, 14, 22), wallColor, cx + 35, 7, cz);

        // Station platform canopy (flat box)
        addMesh(new THREE.BoxGeometry(60, 0.5, 12), 0x909088, cx, 6, cz + 18);
        // Canopy supports
        for (var sp = -25; sp <= 25; sp += 10) {
            addMesh(new THREE.CylinderGeometry(0.25, 0.25, 6, 6), darkTrim, cx + sp, 3, cz + 18);
        }

        // Train tracks (flat boxes)
        addMesh(new THREE.BoxGeometry(70, 0.1, 1.2), 0x5A5A5A, cx, 0.05, cz + 24);
        addMesh(new THREE.BoxGeometry(70, 0.1, 1.2), 0x5A5A5A, cx, 0.05, cz + 27);

        // Clock tower face
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12), 0xEEEECC, cx, 28, cz - 12.5);

        // Steps
        addMesh(new THREE.BoxGeometry(22, 0.5, 4), trimColor, cx, 0.25, cz - 14.5);
        addMesh(new THREE.BoxGeometry(24, 0.5, 4), trimColor, cx, 0, cz - 16.5);
    }

    // ── OLD MARKET (PIAȚA CENTRALĂ) ─────────────────────────────────────────
    function buildOldMarket() {
        var cx = 23560 + 120, cz = 100;
        var wallColor = 0xCC8833;
        var roofColor = 0xAA6622;
        var floorColor = 0xC0A060;

        // Main market hall
        addMesh(new THREE.BoxGeometry(40, 10, 30), wallColor, cx, 5, cz);
        // Main hall roof (shed style)
        addMesh(new THREE.BoxGeometry(42, 2, 32), roofColor, cx, 11, cz);

        // Side market hall
        addMesh(new THREE.BoxGeometry(18, 8, 30), wallColor, cx + 30, 4, cz);
        addMesh(new THREE.BoxGeometry(19, 1.5, 31), roofColor, cx + 30, 9, cz);

        // Open-air stall covers (smaller flat boxes on posts)
        var stallData = [[-15, 22], [0, 22], [15, 22], [-15, -22], [0, -22], [15, -22]];
        for (var s = 0; s < stallData.length; s++) {
            addMesh(new THREE.BoxGeometry(8, 0.4, 5), roofColor, cx + stallData[s][0], 3.5, cz + stallData[s][1]);
            addMesh(new THREE.CylinderGeometry(0.15, 0.15, 3.5, 5), 0x884400, cx + stallData[s][0] - 3.5, 1.75, cz + stallData[s][1]);
            addMesh(new THREE.CylinderGeometry(0.15, 0.15, 3.5, 5), 0x884400, cx + stallData[s][0] + 3.5, 1.75, cz + stallData[s][1]);
        }

        // Market square floor
        addMesh(new THREE.BoxGeometry(70, 0.2, 50), floorColor, cx + 5, 0.1, cz);

        // Market clock tower
        addMesh(new THREE.BoxGeometry(4, 14, 4), 0xBB7722, cx - 22, 7, cz - 12);
        addMesh(new THREE.ConeGeometry(2.5, 4, 4), roofColor, cx - 22, 16, cz - 12);
        addMesh(new THREE.CylinderGeometry(1, 1, 0.2, 10), 0xCCCC44, cx - 22, 12, cz - 12.5);
    }

    // ── CIRCUS BUILDING ──────────────────────────────────────────────────────
    function buildCircus() {
        var cx = 23560 - 120, cz = 100;
        var wallColor = 0xC8B8A0;
        var roofColor = 0xA89880;

        // Circular drum body
        addMesh(new THREE.CylinderGeometry(18, 18, 14, 20), wallColor, cx, 7, cz);

        // Conical roof
        addMesh(new THREE.ConeGeometry(18.5, 12, 20), roofColor, cx, 20, cz);

        // Roof tip spire
        addMesh(new THREE.CylinderGeometry(0.4, 1, 4, 8), roofColor, cx, 27, cz);
        addMesh(new THREE.SphereGeometry(0.6, 8, 5), 0xCC4444, cx, 29.5, cz);

        // Base ring / podium
        addMesh(new THREE.CylinderGeometry(20, 20.5, 2, 20), 0xB8A890, cx, 1, cz);

        // Decorative arched entrance portals (boxes)
        var entryAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
        for (var e = 0; e < 4; e++) {
            var ang = entryAngles[e];
            var ex = cx + Math.sin(ang) * 18;
            var ez = cz + Math.cos(ang) * 18;
            var entrymesh = addMesh(new THREE.BoxGeometry(4, 7, 1.5), 0xD0C0A8, ex, 3.5, ez);
            entrymesh.rotation.y = ang;
        }

        // Exterior pilasters around drum
        for (var p = 0; p < 10; p++) {
            var pang = (p / 10) * Math.PI * 2;
            var px = cx + Math.sin(pang) * 17.5;
            var pz = cz + Math.cos(pang) * 17.5;
            var pilaster = addMesh(new THREE.BoxGeometry(1, 14, 1.5), 0xD8C8B0, px, 7, pz);
            pilaster.rotation.y = pang;
        }

        // Parking / approach plaza
        addMesh(new THREE.CylinderGeometry(26, 26, 0.2, 20), 0xA0A090, cx, 0.1, cz);
    }

    // ── BÎC RIVER & VICTORY PARK ─────────────────────────────────────────────
    function buildBicRiver() {
        var cx = 23560 - 180, cz = 0;
        var waterColor = 0x2A6A8A;
        var bankColor = 0x5A7A3A;
        var sandColor = 0xC8B880;

        // River channel segments (chained boxes)
        addMesh(new THREE.BoxGeometry(12, 0.4, 120), waterColor, cx, 0.2, cz);

        // River banks
        addMesh(new THREE.BoxGeometry(8, 0.6, 120), bankColor, cx - 10, 0.3, cz);
        addMesh(new THREE.BoxGeometry(8, 0.6, 120), bankColor, cx + 10, 0.3, cz);
        addMesh(new THREE.BoxGeometry(4, 0.3, 120), sandColor, cx - 7, 0.15, cz);
        addMesh(new THREE.BoxGeometry(4, 0.3, 120), sandColor, cx + 7, 0.15, cz);

        // Victory Park lawn
        addMesh(new THREE.BoxGeometry(60, 0.3, 80), 0x3A7030, cx + 40, 0.15, cz);

        // Park trees along river
        var riverTrees = [
            [0, -45], [0, -25], [0, 15], [0, 40],
            [-16, -40], [-16, -10], [-16, 20], [-16, 45],
            [16, -40], [16, -10], [16, 20], [16, 45]
        ];
        for (var rt = 0; rt < riverTrees.length; rt++) {
            var rtx = riverTrees[rt][0], rtz = riverTrees[rt][1];
            addMesh(new THREE.CylinderGeometry(0.35, 0.45, 4.5, 7), 0x3A2510, cx + rtx, 2.25, cz + rtz);
            addMesh(new THREE.SphereGeometry(2.8, 8, 6), 0x246A18, cx + rtx, 6.5, cz + rtz);
        }

        // Victory Park war memorial — obelisk
        addMesh(new THREE.BoxGeometry(4, 2, 4), 0x888880, cx + 35, 1, cz - 20);
        addMesh(new THREE.BoxGeometry(2.5, 16, 2.5), 0x909088, cx + 35, 10, cz - 20);
        addMesh(new THREE.ConeGeometry(1.5, 4, 4), 0x989890, cx + 35, 20, cz - 20);

        // Stone memorial wall
        addMesh(new THREE.BoxGeometry(20, 3, 1), 0x888878, cx + 35, 1.5, cz - 14);

        // Footbridge over river
        addMesh(new THREE.BoxGeometry(14, 0.5, 3), 0xA09080, cx, 1.5, cz + 5);
        addMesh(new THREE.CylinderGeometry(0.25, 0.25, 2, 6), 0x808070, cx - 5, 0.75, cz + 5);
        addMesh(new THREE.CylinderGeometry(0.25, 0.25, 2, 6), 0x808070, cx + 5, 0.75, cz + 5);
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
