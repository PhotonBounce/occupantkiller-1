window.BarcelonaSagrada = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 23160;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addWireframe(geo, color, x, y, z) {
        var mat = new THREE.LineBasicMaterial({ color: color });
        var edges = new THREE.EdgesGeometry(geo);
        var line = new THREE.LineSegments(edges, mat);
        line.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        scene.add(line);
        objects.push(line);
        return line;
    }

    function buildSagradaFamilia() {
        // Ground base / plinth
        var baseGeo = new THREE.BoxGeometry(120, 4, 80);
        addMesh(baseGeo, 0xD4C8A0, 0, 2, 0);

        // Main nave body
        var naveGeo = new THREE.BoxGeometry(90, 50, 60);
        addMesh(naveGeo, 0xD4C8A0, 0, 29, 0);

        // Transept crossing body
        var crossGeo = new THREE.BoxGeometry(40, 65, 90);
        addMesh(crossGeo, 0xD4C8A0, 0, 36, 0);

        // Apse at east end
        var apseGeo = new THREE.CylinderGeometry(22, 24, 48, 8);
        addMesh(apseGeo, 0xD4C8A0, -45, 26, 0);

        // Central Jesus tower (tallest, 172m scaled)
        var jesusTowerGeo = new THREE.CylinderGeometry(6, 9, 172, 8);
        addMesh(jesusTowerGeo, 0xE0D8B0, 0, 88, 0);
        var jesusTipGeo = new THREE.ConeGeometry(6, 28, 8);
        addMesh(jesusTipGeo, 0xF0ECD0, 0, 190, 0);
        var jesusCapGeo = new THREE.SphereGeometry(5, 8, 6);
        addMesh(jesusCapGeo, 0xFFD700, 0, 205, 0);

        // Mary tower (second tallest ~172 vicinity)
        var maryGeo = new THREE.CylinderGeometry(5, 7, 138, 8);
        addMesh(maryGeo, 0xD4C8A0, 18, 71, 0);
        var maryTipGeo = new THREE.ConeGeometry(5, 22, 8);
        addMesh(maryTipGeo, 0xE8E0C0, 18, 151, 0);

        // 4 Evangelist towers around crossing
        var evGeo1 = new THREE.CylinderGeometry(4, 6, 120, 8);
        addMesh(evGeo1, 0xD4C8A0, -20, 62, 20);
        addMesh(new THREE.ConeGeometry(4, 18, 8), 0xDDD5B0, -20, 131, 20);

        addMesh(new THREE.CylinderGeometry(4, 6, 120, 8), 0xD4C8A0, 20, 62, 20);
        addMesh(new THREE.ConeGeometry(4, 18, 8), 0xDDD5B0, 20, 131, 20);

        addMesh(new THREE.CylinderGeometry(4, 6, 120, 8), 0xD4C8A0, -20, 62, -20);
        addMesh(new THREE.ConeGeometry(4, 18, 8), 0xDDD5B0, -20, 131, -20);

        addMesh(new THREE.CylinderGeometry(4, 6, 120, 8), 0xD4C8A0, 20, 62, -20);
        addMesh(new THREE.ConeGeometry(4, 18, 8), 0xDDD5B0, 20, 131, -20);

        // Nativity facade spires (4 tall on east face) ~100m
        var natSpirePositions = [-18, -6, 6, 18];
        for (var i = 0; i < natSpirePositions.length; i++) {
            var sx = natSpirePositions[i];
            addMesh(new THREE.CylinderGeometry(3, 5, 100, 8), 0xC8BC90, sx, 52, -42);
            addMesh(new THREE.ConeGeometry(3, 16, 8), 0xD8D0B0, sx, 110, -42);
            // Spiral decoration bands
            addMesh(new THREE.CylinderGeometry(5.5, 5.5, 2, 8), 0xBDB080, sx, 30, -42);
            addMesh(new THREE.CylinderGeometry(5.5, 5.5, 2, 8), 0xBDB080, sx, 55, -42);
        }

        // Passion facade spires (4 on west face) ~100m
        for (var j = 0; j < natSpirePositions.length; j++) {
            var px = natSpirePositions[j];
            addMesh(new THREE.CylinderGeometry(3, 5, 100, 8), 0xC8BC90, px, 52, 42);
            addMesh(new THREE.ConeGeometry(3, 16, 8), 0xD8D0B0, px, 110, 42);
        }

        // Nativity facade portal arch detail
        var portalGeo = new THREE.BoxGeometry(30, 30, 4);
        addMesh(portalGeo, 0xC4B890, 0, 19, -43);
        var portalTopGeo = new THREE.CylinderGeometry(15, 15, 4, 12, 1, false, 0, Math.PI);
        addMesh(portalTopGeo, 0xC4B890, 0, 34, -43);

        // Rose windows (circular)
        var roseGeo = new THREE.CylinderGeometry(8, 8, 2, 12);
        roseGeo.rotateX(Math.PI / 2);
        addMesh(roseGeo, 0xA0B8D0, 0, 50, -44);
    }

    function buildParkGuell() {
        var ox = 260;
        var oz = -180;

        // Hillside base
        var hillGeo = new THREE.BoxGeometry(200, 40, 160);
        addMesh(hillGeo, 0x4CAF50, ox, 20, oz);

        // Hill slope front
        var slopeGeo = new THREE.BoxGeometry(200, 20, 60);
        addMesh(slopeGeo, 0x558B2F, ox, 8, oz + 80);

        // Hypostyle Room columns (86 columns — we place a representative set)
        var colColor = 0xD4C8A0;
        for (var ci = 0; ci < 5; ci++) {
            for (var cj = 0; cj < 4; cj++) {
                var colX = ox - 50 + ci * 25;
                var colZ = oz - 30 + cj * 20;
                addMesh(new THREE.CylinderGeometry(3, 4, 28, 8), colColor, colX, 54, colZ);
                // Capital (wider top)
                addMesh(new THREE.CylinderGeometry(5, 3, 4, 8), colColor, colX, 69, colZ);
            }
        }

        // Hypostyle Room ceiling slab
        var ceilGeo = new THREE.BoxGeometry(130, 4, 90);
        addMesh(ceilGeo, 0xC8B870, ox, 73, oz - 10);

        // Main terrace / serpentine bench platform
        var terraceGeo = new THREE.BoxGeometry(160, 3, 100);
        addMesh(terraceGeo, 0x4CAF50, ox, 77, oz - 10);

        // Serpentine bench (mosaic, blue and white) — approximated as curved segments
        var benchColor = 0x2196F3;
        var benchPositions = [
            [-70, 0, -55], [-50, 0, -65], [-30, 0, -70], [-10, 0, -72], [10, 0, -70],
            [30, 0, -65], [50, 0, -55], [70, 0, -45]
        ];
        for (var bi = 0; bi < benchPositions.length; bi++) {
            var bp = benchPositions[bi];
            addMesh(new THREE.BoxGeometry(22, 3, 5), benchColor, ox + bp[0], 80 + bp[1], oz + bp[2]);
        }

        // Dragon staircase (iconic salamander/dragon)
        addMesh(new THREE.BoxGeometry(30, 6, 60), 0x8BC34A, ox, 47, oz + 100);
        // Dragon body
        addMesh(new THREE.BoxGeometry(10, 8, 20), 0xF44336, ox, 52, oz + 90);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0xFF5722, ox, 58, oz + 80);

        // Gingerbread gatehouses (two)
        addMesh(new THREE.BoxGeometry(18, 20, 18), 0xFFCDD2, ox - 40, 50, oz + 110);
        addMesh(new THREE.ConeGeometry(11, 14, 8), 0xFF8A65, ox - 40, 67, oz + 110);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0xFF5722, ox - 40, 75, oz + 110);

        addMesh(new THREE.BoxGeometry(18, 20, 18), 0xFFCDD2, ox + 40, 50, oz + 110);
        addMesh(new THREE.ConeGeometry(11, 14, 8), 0xFF8A65, ox + 40, 67, oz + 110);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0xFF5722, ox + 40, 75, oz + 110);

        // Viaducts / elevated walkways
        addMesh(new THREE.BoxGeometry(180, 5, 12), 0xBCAAA4, ox, 48, oz);
        // Viaduct supports
        for (var vi = 0; vi < 6; vi++) {
            addMesh(new THREE.CylinderGeometry(2, 3, 20, 6), 0xA1887F, ox - 75 + vi * 30, 38, oz);
        }

        // Trees in park
        var treePositions = [
            [-80, 20], [-60, -10], [-40, 40], [60, 20], [80, -20], [30, -50]
        ];
        for (var ti = 0; ti < treePositions.length; ti++) {
            var tp = treePositions[ti];
            addMesh(new THREE.CylinderGeometry(1, 2, 12, 6), 0x5D4037, ox + tp[0], 83, oz + tp[1]);
            addMesh(new THREE.SphereGeometry(7, 7, 5), 0x388E3C, ox + tp[0], 96, oz + tp[1]);
        }
    }

    function buildGothicQuarter() {
        var ox = -200;
        var oz = 80;

        // Medieval street block cluster
        var blockColors = [0xD4A870, 0xC49860, 0xE0B880, 0xCC9050];
        var blockDefs = [
            [0, 0, 40, 22, 30],
            [60, 10, 35, 18, 28],
            [-60, 0, 38, 20, 32],
            [15, -50, 30, 16, 25],
            [-45, 60, 45, 24, 35],
            [80, -40, 32, 19, 22],
            [-90, -30, 36, 21, 28],
            [30, 70, 28, 15, 22],
            [-20, -80, 42, 23, 30]
        ];
        for (var bi = 0; bi < blockDefs.length; bi++) {
            var bd = blockDefs[bi];
            var color = blockColors[bi % blockColors.length];
            addMesh(new THREE.BoxGeometry(bd[2], bd[3], bd[4]), color, ox + bd[0], bd[3] / 2, oz + bd[1]);
        }

        // Barcelona Cathedral
        addMesh(new THREE.BoxGeometry(50, 40, 70), 0x8D6E63, ox, 20, oz - 100);
        // Cathedral twin towers
        addMesh(new THREE.CylinderGeometry(6, 7, 70, 8), 0x795548, ox - 18, 39, oz - 110);
        addMesh(new THREE.ConeGeometry(6, 16, 8), 0x6D4C41, ox - 18, 83, oz - 110);
        addMesh(new THREE.CylinderGeometry(6, 7, 70, 8), 0x795548, ox + 18, 39, oz - 110);
        addMesh(new THREE.ConeGeometry(6, 16, 8), 0x6D4C41, ox + 18, 83, oz - 110);
        // Cathedral central spire
        addMesh(new THREE.CylinderGeometry(4, 5, 55, 8), 0x8D6E63, ox, 47, oz - 105);
        addMesh(new THREE.ConeGeometry(4, 14, 8), 0x6D4C41, ox, 82, oz - 105);

        // Roman walls
        addMesh(new THREE.BoxGeometry(200, 12, 4), 0xBCAAA4, ox, 6, oz + 50);
        addMesh(new THREE.BoxGeometry(4, 12, 120), 0xBCAAA4, ox - 100, 6, oz - 10);
        addMesh(new THREE.BoxGeometry(4, 12, 120), 0xBCAAA4, ox + 100, 6, oz - 10);
        // Roman towers
        addMesh(new THREE.CylinderGeometry(6, 6, 18, 8), 0xA1887F, ox - 100, 9, oz + 50);
        addMesh(new THREE.CylinderGeometry(6, 6, 18, 8), 0xA1887F, ox + 100, 9, oz + 50);
        addMesh(new THREE.CylinderGeometry(6, 6, 18, 8), 0xA1887F, ox - 100, 9, oz - 70);
        addMesh(new THREE.CylinderGeometry(6, 6, 18, 8), 0xA1887F, ox + 100, 9, oz - 70);

        // Plaça Reial fountain
        addMesh(new THREE.CylinderGeometry(12, 12, 2, 12), 0xB0BEC5, ox + 50, 1, oz + 40);
        addMesh(new THREE.CylinderGeometry(3, 3, 16, 8), 0x90A4AE, ox + 50, 9, oz + 40);
        addMesh(new THREE.CylinderGeometry(8, 8, 2, 12), 0xB0BEC5, ox + 50, 18, oz + 40);

        // Palm trees in Plaça Reial
        var palmPos = [[-15, 0], [15, 0], [0, -15], [0, 15]];
        for (var pi = 0; pi < palmPos.length; pi++) {
            addMesh(new THREE.CylinderGeometry(1, 2, 18, 6), 0x795548, ox + 50 + palmPos[pi][0], 9, oz + 40 + palmPos[pi][1]);
            addMesh(new THREE.SphereGeometry(5, 6, 4), 0x558B2F, ox + 50 + palmPos[pi][0], 20, oz + 40 + palmPos[pi][1]);
        }
    }

    function buildCasaBatllo() {
        var ox = 120;
        var oz = 90;

        // Main building body — wave facade
        addMesh(new THREE.BoxGeometry(28, 55, 22), 0x5599CC, ox, 29, oz);

        // Wave facade detail — staggered horizontal bands
        for (var fi = 0; fi < 6; fi++) {
            addMesh(new THREE.BoxGeometry(30, 3, 2), 0x4488BB, ox, 10 + fi * 8, oz - 12);
        }

        // Dragon-back roof (iconic curved roof with ceramic tiles)
        addMesh(new THREE.CylinderGeometry(16, 18, 10, 10), 0x26A69A, ox, 61, oz);
        // Ceramic tile bumps on roof
        var tileAngles = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
        for (var tai = 0; tai < tileAngles.length; tai++) {
            var trad = tileAngles[tai] * Math.PI / 180;
            var tx = Math.cos(trad) * 12;
            var tz = Math.sin(trad) * 12;
            addMesh(new THREE.SphereGeometry(2.5, 6, 4), 0x00BCD4, ox + tx, 65, oz + tz);
        }

        // Tower / cross on roof
        addMesh(new THREE.CylinderGeometry(2, 2, 20, 6), 0x7986CB, ox, 77, oz);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0x9C27B0, ox, 89, oz);

        // Balconies (skull-shaped — bone-like)
        for (var bfi = 0; bfi < 4; bfi++) {
            addMesh(new THREE.BoxGeometry(32, 2, 5), 0xF5F5F5, ox, 18 + bfi * 10, oz - 14);
            // Balcony rail details
            addMesh(new THREE.BoxGeometry(32, 5, 2), 0xE8E8E8, ox, 20 + bfi * 10, oz - 15);
        }

        // Ground floor arches (bone columns)
        for (var aci = -10; aci <= 10; aci += 10) {
            addMesh(new THREE.CylinderGeometry(2, 3, 10, 6), 0xF5F5F5, ox + aci, 5, oz - 12);
        }
    }

    function buildCasaMila() {
        var ox = 160;
        var oz = 30;

        // Main building undulating body
        addMesh(new THREE.BoxGeometry(50, 52, 35), 0xD0CCC0, ox, 27, oz);

        // Undulating facade bumps
        for (var ufi = 0; ufi < 4; ufi++) {
            addMesh(new THREE.CylinderGeometry(5, 5, 52, 8), 0xC8C4B8, ox - 20 + ufi * 14, 27, oz - 18);
        }

        // Roof terrace
        addMesh(new THREE.BoxGeometry(52, 3, 37), 0xBEBAB4, ox, 54, oz);

        // Warrior chimney stacks (iconic twisted chimneys)
        var chimneyPositions = [
            [-18, 0], [-8, 10], [2, -5], [12, 8], [20, -10], [-15, -15]
        ];
        for (var chi = 0; chi < chimneyPositions.length; chi++) {
            var cp = chimneyPositions[chi];
            addMesh(new THREE.CylinderGeometry(2, 3, 14, 6), 0xBCB8B0, ox + cp[0], 63, oz + cp[1]);
            addMesh(new THREE.SphereGeometry(3, 6, 5), 0x9E9E9E, ox + cp[0], 71, oz + cp[1]);
        }

        // Horizontal facade floor lines
        for (var fli = 0; fli < 6; fli++) {
            addMesh(new THREE.BoxGeometry(52, 1, 37), 0xC4C0B8, ox, 12 + fli * 8, oz);
        }

        // Courtyard (inner void approximated by dark box)
        addMesh(new THREE.BoxGeometry(18, 50, 18), 0x424242, ox, 26, oz);
    }

    function buildCampNou() {
        var ox = -300;
        var oz = -60;

        // Outer oval wall
        addMesh(new THREE.CylinderGeometry(110, 110, 8, 16), 0xCCCCDD, ox, 4, oz);
        // Inner oval wall (seating bowl)
        addMesh(new THREE.CylinderGeometry(90, 90, 6, 16), 0xAAAABB, ox, 7, oz);
        // Playing field (slightly recessed, green)
        addMesh(new THREE.CylinderGeometry(70, 70, 2, 16), 0x2E7D32, ox, 2, oz);

        // Seating tiers (three rings)
        addMesh(new THREE.CylinderGeometry(88, 95, 20, 16), 0xBBBBCC, ox, 14, oz);
        addMesh(new THREE.CylinderGeometry(68, 80, 18, 16), 0xAAAAAB, ox, 30, oz);
        addMesh(new THREE.CylinderGeometry(48, 62, 16, 16), 0x999AAB, ox, 44, oz);

        // Roof canopy ring
        addMesh(new THREE.CylinderGeometry(105, 108, 4, 16), 0xE0E0F0, ox, 54, oz);

        // Main entrance / towers
        addMesh(new THREE.BoxGeometry(20, 50, 12), 0xDDDDEE, ox - 95, 25, oz);
        addMesh(new THREE.BoxGeometry(20, 50, 12), 0xDDDDEE, ox + 95, 25, oz);

        // Lighting pylons
        var pylonPositions = [
            [-80, -80], [80, -80], [-80, 80], [80, 80]
        ];
        for (var pyi = 0; pyi < pylonPositions.length; pyi++) {
            var pyp = pylonPositions[pyi];
            addMesh(new THREE.CylinderGeometry(1.5, 2, 55, 6), 0xCCCCCC, ox + pyp[0], 29, oz + pyp[1]);
            addMesh(new THREE.BoxGeometry(14, 2, 6), 0xDDDDDD, ox + pyp[0], 58, oz + pyp[1]);
        }
    }

    function buildLasRamblas() {
        var ox = -80;
        var oz = 220;

        // Central promenade (tree-lined boulevard, 1.2km — scaled)
        addMesh(new THREE.BoxGeometry(24, 1, 300), 0xD4C8A0, ox, 0.5, oz);

        // Left carriageway
        addMesh(new THREE.BoxGeometry(18, 1, 300), 0x9E9E9E, ox - 21, 0.5, oz);
        // Right carriageway
        addMesh(new THREE.BoxGeometry(18, 1, 300), 0x9E9E9E, ox + 21, 0.5, oz);

        // Trees along promenade (both sides, spaced)
        for (var tri = 0; tri < 10; tri++) {
            var tz = oz - 130 + tri * 28;
            // Left trees
            addMesh(new THREE.CylinderGeometry(1, 2, 14, 6), 0x5D4037, ox - 10, 7, tz);
            addMesh(new THREE.SphereGeometry(5, 6, 4), 0x388E3C, ox - 10, 18, tz);
            // Right trees
            addMesh(new THREE.CylinderGeometry(1, 2, 14, 6), 0x5D4037, ox + 10, 7, tz);
            addMesh(new THREE.SphereGeometry(5, 6, 4), 0x388E3C, ox + 10, 18, tz);
        }

        // Flower stall kiosks
        for (var ki = 0; ki < 5; ki++) {
            addMesh(new THREE.BoxGeometry(6, 4, 4), 0xFF8A65, ox, 2, oz - 80 + ki * 35);
            addMesh(new THREE.BoxGeometry(7, 1, 5), 0xFFB74D, ox, 4, oz - 80 + ki * 35);
        }

        // Columbus Monument at sea end
        addMesh(new THREE.CylinderGeometry(4, 7, 8, 8), 0x9E9E9E, ox, 4, oz + 145);
        addMesh(new THREE.CylinderGeometry(2, 4, 40, 8), 0x8D8D8D, ox, 24, oz + 145);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x757575, ox, 48, oz + 145);
        // Columbus statue
        addMesh(new THREE.CylinderGeometry(1, 1.5, 8, 6), 0xBDBDBD, ox, 54, oz + 145);
        addMesh(new THREE.SphereGeometry(2, 6, 4), 0xBDBDBD, ox, 62, oz + 145);
    }

    function buildMediterranean() {
        var ox = 0;
        var oz = 380;

        // Sea surface (wide flat boxes tiled)
        for (var si = 0; si < 4; si++) {
            addMesh(new THREE.BoxGeometry(600, 1, 120), 0x1A5A8A, ox - 300 + si * 150, -0.5, oz + si * 30);
        }

        // Beach promenade (Barceloneta)
        addMesh(new THREE.BoxGeometry(500, 1, 60), 0xF4E4A6, ox, 0.3, oz - 30);

        // Port Vell harbour
        addMesh(new THREE.BoxGeometry(180, 2, 80), 0x15527A, ox + 200, 0, oz - 10);

        // Marina jetties
        for (var ji = 0; ji < 5; ji++) {
            addMesh(new THREE.BoxGeometry(4, 1, 60), 0x8D6E63, ox + 130 + ji * 18, 1, oz + 5);
        }

        // Boats in harbour
        addMesh(new THREE.BoxGeometry(14, 4, 6), 0xFFFFFF, ox + 150, 2, oz - 5);
        addMesh(new THREE.BoxGeometry(12, 4, 5), 0xE3F2FD, ox + 175, 2, oz + 10);
        addMesh(new THREE.BoxGeometry(16, 4, 7), 0xFFF9C4, ox + 200, 2, oz - 8);

        // Masts
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 16, 4), 0xBCAAA4, ox + 150, 10, oz - 5);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 14, 4), 0xBCAAA4, ox + 175, 10, oz + 10);

        // W Barcelona hotel (sail-shaped tower near beach)
        addMesh(new THREE.BoxGeometry(18, 80, 22), 0xB3E5FC, ox - 180, 40, oz - 20);
        addMesh(new THREE.ConeGeometry(10, 20, 4), 0x81D4FA, ox - 180, 90, oz - 20);
    }

    function buildMontjuic() {
        var ox = -360;
        var oz = 100;

        // Hill mass
        addMesh(new THREE.BoxGeometry(250, 80, 200), 0x6B8C42, ox, 40, oz);
        addMesh(new THREE.BoxGeometry(180, 40, 140), 0x7B9C52, ox, 100, oz);
        addMesh(new THREE.SphereGeometry(80, 8, 6), 0x7B9C52, ox, 120, oz);

        // Castle fortress
        addMesh(new THREE.BoxGeometry(80, 20, 60), 0x8D8D8D, ox, 132, oz - 20);
        // Castle walls / bastions
        addMesh(new THREE.BoxGeometry(20, 18, 18), 0x757575, ox - 38, 131, oz - 38);
        addMesh(new THREE.BoxGeometry(20, 18, 18), 0x757575, ox + 38, 131, oz - 38);
        addMesh(new THREE.BoxGeometry(20, 18, 18), 0x757575, ox - 38, 131, oz + 0);
        addMesh(new THREE.BoxGeometry(20, 18, 18), 0x757575, ox + 38, 131, oz + 0);
        // Castle keep
        addMesh(new THREE.CylinderGeometry(8, 10, 30, 8), 0x6D6D6D, ox, 157, oz - 20);
        addMesh(new THREE.ConeGeometry(9, 10, 8), 0x5D5D5D, ox, 173, oz - 20);

        // Olympic stadium
        addMesh(new THREE.CylinderGeometry(80, 80, 8, 14), 0xCCCCCC, ox + 100, 104, oz + 80);
        addMesh(new THREE.CylinderGeometry(65, 65, 6, 14), 0x9E9E9E, ox + 100, 110, oz + 80);
        addMesh(new THREE.CylinderGeometry(50, 50, 2, 14), 0x4CAF50, ox + 100, 105, oz + 80);

        // Olympic flame torch
        addMesh(new THREE.CylinderGeometry(1.5, 2, 30, 6), 0xCCCCCC, ox + 100, 120, oz + 28);
        addMesh(new THREE.SphereGeometry(4, 6, 4), 0xFF6F00, ox + 100, 137, oz + 28);

        // Miró Foundation building
        addMesh(new THREE.BoxGeometry(60, 16, 50), 0xFFFFFF, ox - 60, 112, oz + 60);
        addMesh(new THREE.BoxGeometry(30, 10, 30), 0xF5F5F5, ox - 60, 126, oz + 60);
        addMesh(new THREE.CylinderGeometry(8, 8, 4, 8), 0xE0E0E0, ox - 60, 134, oz + 60);

        // Teleferic cable car pylons
        addMesh(new THREE.CylinderGeometry(2, 3, 70, 6), 0x9E9E9E, ox - 150, 75, oz - 80);
        addMesh(new THREE.BoxGeometry(20, 3, 6), 0x9E9E9E, ox - 150, 111, oz - 80);

        // Trees on hill
        for (var mti = 0; mti < 8; mti++) {
            var mtx = ox - 100 + mti * 25;
            var mtz = oz + 20 + (mti % 3) * 30;
            addMesh(new THREE.CylinderGeometry(1, 2, 12, 6), 0x4E342E, mtx, 122, mtz);
            addMesh(new THREE.SphereGeometry(6, 6, 4), 0x388E3C, mtx, 132, mtz);
        }
    }

    function build() {
        buildSagradaFamilia();
        buildParkGuell();
        buildGothicQuarter();
        buildCasaBatllo();
        buildCasaMila();
        buildCampNou();
        buildLasRamblas();
        buildMediterranean();
        buildMontjuic();
    }

    function update(delta) {
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
