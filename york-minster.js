window.YorkMinster = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        buildYorkMinster();
        buildShambles();
        buildYorkWalls();
        buildCliffordsTower();
        buildJorvikRoman();
        buildRiverOuse();
    }

    function buildYorkMinster() {
        var ox = 15360;
        var oz = -200;
        var stone = 0xd4c9a8;
        var darkstone = 0xa09070;
        var roof = 0x708090;
        var glass = 0x4466aa;
        var golds = 0xccaa44;

        // Nave — long central body
        makebox(30, 22, 80, stone, ox, 11, oz);
        // Nave roof ridge
        makebox(4, 6, 80, roof, ox, 25, oz);
        // Nave roof slopes north
        makebox(18, 1, 80, roof, ox - 8, 23, oz);
        // Nave roof slopes south
        makebox(18, 1, 80, roof, ox + 8, 23, oz);

        // Choir and presbytery — east end
        makebox(26, 20, 50, stone, ox, 10, oz + 65);
        makebox(4, 5, 50, roof, ox, 23, oz + 65);

        // North transept
        makebox(40, 20, 20, stone, ox - 30, 10, oz + 10);
        makebox(4, 5, 20, roof, ox - 30, 23, oz + 10);
        // Five Sisters window — north transept north face, tall lancets
        makebox(16, 18, 1, glass, ox - 49, 10, oz + 10);
        makebox(1, 18, 1, darkstone, ox - 45, 10, oz + 10);
        makebox(1, 18, 1, darkstone, ox - 41, 10, oz + 10);
        makebox(1, 18, 1, darkstone, ox - 37, 10, oz + 10);
        makebox(1, 18, 1, darkstone, ox - 33, 10, oz + 10);

        // South transept
        makebox(40, 20, 20, stone, ox + 30, 10, oz + 10);
        makebox(4, 5, 20, roof, ox + 30, 23, oz + 10);

        // Central tower — massive square with battlements
        makebox(18, 50, 18, stone, ox, 25, oz + 10);
        // Central tower battlements
        makebox(20, 3, 20, darkstone, ox, 51, oz + 10);
        makebox(2, 4, 20, darkstone, ox - 8, 53, oz + 10);
        makebox(2, 4, 20, darkstone, ox - 4, 53, oz + 10);
        makebox(2, 4, 20, darkstone, ox, 53, oz + 10);
        makebox(2, 4, 20, darkstone, ox + 4, 53, oz + 10);
        makebox(2, 4, 20, darkstone, ox + 8, 53, oz + 10);

        // West front — twin towers
        // Left (north) west tower
        makebox(10, 55, 10, stone, ox - 10, 27, oz - 42);
        // Left tower pinnacles
        makecone(1.5, 8, 4, darkstone, ox - 10, 62, oz - 42);
        makecyl(0.3, 0.3, 8, 6, darkstone, ox - 14, 62, oz - 46);
        makecyl(0.3, 0.3, 8, 6, darkstone, ox - 6, 62, oz - 46);
        makecyl(0.3, 0.3, 8, 6, darkstone, ox - 14, 62, oz - 38);
        makecyl(0.3, 0.3, 8, 6, darkstone, ox - 6, 62, oz - 38);

        // Right (south) west tower
        makebox(10, 55, 10, stone, ox + 10, 27, oz - 42);
        makecone(1.5, 8, 4, darkstone, ox + 10, 62, oz - 42);
        makecyl(0.3, 0.3, 8, 6, darkstone, ox + 14, 62, oz - 46);
        makecyl(0.3, 0.3, 8, 6, darkstone, ox + 6, 62, oz - 46);
        makecyl(0.3, 0.3, 8, 6, darkstone, ox + 14, 62, oz - 38);
        makecyl(0.3, 0.3, 8, 6, darkstone, ox + 6, 62, oz - 38);

        // West front screen wall between towers
        makebox(20, 40, 3, stone, ox, 20, oz - 47);
        // Great west window
        makebox(12, 20, 1, glass, ox, 20, oz - 48);

        // Great east window — largest medieval stained glass
        makebox(16, 20, 1, glass, ox, 20, oz + 92);
        // East end tracery
        makebox(2, 22, 2, darkstone, ox - 8, 20, oz + 92);
        makebox(2, 22, 2, darkstone, ox + 8, 20, oz + 92);
        makebox(16, 2, 2, darkstone, ox, 32, oz + 92);

        // Chapter house — octagonal
        makecyl(12, 12, 18, 8, stone, ox - 20, 9, oz + 80);
        makecone(11, 14, 8, roof, ox - 20, 22, oz + 80);

        // Flying buttresses nave — north side
        makebox(2, 8, 1, darkstone, ox - 16, 18, oz - 30);
        makebox(2, 8, 1, darkstone, ox - 16, 18, oz - 10);
        makebox(2, 8, 1, darkstone, ox - 16, 18, oz + 10);
        makebox(2, 8, 1, darkstone, ox - 16, 18, oz + 30);
        // Flying buttresses nave — south side
        makebox(2, 8, 1, darkstone, ox + 16, 18, oz - 30);
        makebox(2, 8, 1, darkstone, ox + 16, 18, oz - 10);
        makebox(2, 8, 1, darkstone, ox + 16, 18, oz + 10);
        makebox(2, 8, 1, darkstone, ox + 16, 18, oz + 30);

        // Pinnacles on nave buttresses
        makecone(0.8, 5, 4, darkstone, ox - 16, 25, oz - 30);
        makecone(0.8, 5, 4, darkstone, ox - 16, 25, oz + 30);
        makecone(0.8, 5, 4, darkstone, ox + 16, 25, oz - 30);
        makecone(0.8, 5, 4, darkstone, ox + 16, 25, oz + 30);

        // Ground level porch south
        makebox(8, 10, 6, stone, ox + 16, 5, oz - 45);
        // Ground level porch north
        makebox(8, 10, 6, stone, ox - 16, 5, oz - 45);

        // Central tower lantern windows
        makebox(6, 8, 1, glass, ox - 9, 30, oz + 10);
        makebox(6, 8, 1, glass, ox + 9, 30, oz + 10);
        makebox(1, 8, 6, glass, ox, 30, oz + 1);
        makebox(1, 8, 6, glass, ox, 30, oz + 19);
    }

    function buildShambles() {
        var ox = 15360;
        var oz = 150;
        var timber = 0x5c3d1e;
        var plaster = 0xf0e8d0;
        var roof = 0x8b4513;
        var cobble = 0x888880;
        var sign = 0xcc8800;

        // Cobbled street — very narrow
        makebox(5, 0.3, 80, cobble, ox, 0.15, oz);

        // Row of jettied buildings — left side (north)
        var i;
        for (i = 0; i < 8; i++) {
            var bz = oz - 35 + i * 10;
            // Ground floor
            makebox(7, 5, 8, plaster, ox - 7, 2.5, bz);
            // Timber frame ground
            makebox(0.4, 5, 8, timber, ox - 4, 2.5, bz);
            makebox(0.4, 5, 8, timber, ox - 10, 2.5, bz);
            makebox(7, 0.4, 8, timber, ox - 7, 5, bz);
            // First floor jetty overhangs by 1.5 units
            makebox(8, 4, 8, plaster, ox - 6.5, 7, bz);
            makebox(0.4, 4, 8, timber, ox - 3, 7, bz);
            makebox(0.4, 4, 8, timber, ox - 10, 7, bz);
            makebox(8, 0.4, 8, timber, ox - 6.5, 9, bz);
            // Second floor jetty overhangs more
            makebox(9, 4, 8, plaster, ox - 6, 11, bz);
            // Roof
            makebox(9, 0.5, 8, roof, ox - 6, 13.5, bz);
            makecone(4, 3, 4, roof, ox - 6, 15.5, bz);
        }

        // Row of jettied buildings — right side (south)
        for (i = 0; i < 8; i++) {
            var bz2 = oz - 35 + i * 10;
            makebox(7, 5, 8, plaster, ox + 7, 2.5, bz2);
            makebox(0.4, 5, 8, timber, ox + 4, 2.5, bz2);
            makebox(0.4, 5, 8, timber, ox + 10, 2.5, bz2);
            makebox(7, 0.4, 8, timber, ox + 7, 5, bz2);
            makebox(8, 4, 8, plaster, ox + 6.5, 7, bz2);
            makebox(0.4, 4, 8, timber, ox + 3, 7, bz2);
            makebox(0.4, 4, 8, timber, ox + 10, 7, bz2);
            makebox(8, 0.4, 8, timber, ox + 6.5, 9, bz2);
            makebox(9, 4, 8, plaster, ox + 6, 11, bz2);
            makebox(9, 0.5, 8, roof, ox + 6, 13.5, bz2);
            makecone(4, 3, 4, roof, ox + 6, 15.5, bz2);
        }

        // Butcher shop signs (hanging boards)
        makebox(2, 1, 0.2, sign, ox - 4, 6, oz - 35);
        makebox(2, 1, 0.2, sign, ox - 4, 6, oz - 25);
        makebox(2, 1, 0.2, sign, ox + 4, 6, oz - 30);
        makebox(2, 1, 0.2, sign, ox + 4, 6, oz - 20);
        // Sign poles
        makecyl(0.1, 0.1, 1.5, 4, timber, ox - 4, 6.5, oz - 35);
        makecyl(0.1, 0.1, 1.5, 4, timber, ox - 4, 6.5, oz - 25);
        makecyl(0.1, 0.1, 1.5, 4, timber, ox + 4, 6.5, oz - 30);
        makecyl(0.1, 0.1, 1.5, 4, timber, ox + 4, 6.5, oz - 20);
    }

    function buildYorkWalls() {
        var ox = 15360;
        var stone = 0xb8a88a;
        var darkstone = 0x8a7a60;
        var roof = 0x6b6b6b;

        // North wall segment — runs east-west
        makebox(200, 8, 4, stone, ox, 4, -350);
        // Wall walk parapet north
        makebox(200, 2, 1, darkstone, ox, 9, -348);
        makebox(200, 2, 1, darkstone, ox, 9, -352);

        // South wall segment
        makebox(200, 8, 4, stone, ox, 4, 350);
        makebox(200, 2, 1, darkstone, ox, 9, 348);
        makebox(200, 2, 1, darkstone, ox, 9, 352);

        // East wall segment — runs north-south
        makebox(4, 8, 200, stone, ox + 120, 4, 0);
        makebox(1, 2, 200, darkstone, ox + 118, 9, 0);
        makebox(1, 2, 200, darkstone, ox + 122, 9, 0);

        // West wall segment
        makebox(4, 8, 200, stone, ox - 120, 4, 0);
        makebox(1, 2, 200, darkstone, ox - 118, 9, 0);
        makebox(1, 2, 200, darkstone, ox - 122, 9, 0);

        // Bootham Bar — northwest gatehouse
        makebox(12, 16, 10, stone, ox - 120, 8, -350);
        // Gatehouse arch passage
        makebox(4, 8, 10, darkstone, ox - 120, 4, -350);
        // Gatehouse upper
        makebox(12, 6, 10, stone, ox - 120, 16, -350);
        // Battlements Bootham
        makebox(14, 2, 12, darkstone, ox - 120, 20, -350);
        makecone(1.5, 6, 4, darkstone, ox - 126, 22, -356);
        makecone(1.5, 6, 4, darkstone, ox - 114, 22, -356);
        makecone(1.5, 6, 4, darkstone, ox - 126, 22, -344);
        makecone(1.5, 6, 4, darkstone, ox - 114, 22, -344);

        // Micklegate Bar — southwest gatehouse
        makebox(12, 16, 10, stone, ox + 100, 8, 350);
        makebox(4, 8, 10, darkstone, ox + 100, 4, 350);
        makebox(12, 6, 10, stone, ox + 100, 16, 350);
        makebox(14, 2, 12, darkstone, ox + 100, 20, 350);
        makecone(1.5, 6, 4, darkstone, ox + 94, 22, 344);
        makecone(1.5, 6, 4, darkstone, ox + 106, 22, 344);
        makecone(1.5, 6, 4, darkstone, ox + 94, 22, 356);
        makecone(1.5, 6, 4, darkstone, ox + 106, 22, 356);

        // Walmgate Bar — east gatehouse with barbican
        makebox(12, 18, 10, stone, ox + 120, 9, 50);
        makebox(4, 9, 10, darkstone, ox + 120, 4, 50);
        // Barbican — extended gate passage
        makebox(8, 12, 20, stone, ox + 120, 6, 60);
        makebox(4, 6, 20, darkstone, ox + 120, 3, 60);
        makebox(10, 2, 22, darkstone, ox + 120, 13, 60);
        makebox(14, 2, 12, darkstone, ox + 120, 20, 50);
        // Walmgate upper rooms
        makebox(12, 6, 10, stone, ox + 120, 18, 50);
        makecone(1.5, 6, 4, darkstone, ox + 114, 23, 44);
        makecone(1.5, 6, 4, darkstone, ox + 126, 23, 44);

        // Monk Bar — 4 storeys, northeast
        makebox(10, 28, 10, stone, ox - 80, 14, -350);
        makebox(4, 9, 10, darkstone, ox - 80, 4, -350);
        makebox(10, 4, 10, stone, ox - 80, 10, -350);
        makebox(10, 4, 10, stone, ox - 80, 16, -350);
        makebox(10, 4, 10, stone, ox - 80, 22, -350);
        makebox(12, 2, 12, darkstone, ox - 80, 29, -350);
        makecone(1.5, 7, 4, darkstone, ox - 80, 32, -350);

        // Wall towers spaced along walls
        makebox(8, 12, 8, stone, ox - 60, 6, -350);
        makebox(8, 12, 8, stone, ox + 40, 6, -350);
        makebox(8, 12, 8, stone, ox - 60, 6, 350);
        makebox(8, 12, 8, stone, ox + 40, 6, 350);
        makebox(8, 12, 8, stone, ox + 120, 6, -100);
        makebox(8, 12, 8, stone, ox + 120, 6, 200);
        makebox(8, 12, 8, stone, ox - 120, 6, -100);
        makebox(8, 12, 8, stone, ox - 120, 6, 200);
    }

    function buildCliffordsTower() {
        var ox = 15360 + 80;
        var oz = 280;
        var motte = 0x8b7355;
        var stone = 0xc8b896;
        var darkstone = 0x9a8870;

        // Motte — high earthwork mound
        makecyl(28, 32, 14, 16, motte, ox, 7, oz);
        makecyl(20, 28, 4, 16, motte, ox, 15, oz);

        // Quatrefoil shell keep — 4-lobed plan approximated
        // Central connecting core
        makebox(18, 12, 18, stone, ox, 22, oz);
        // Four lobes
        makecyl(8, 8, 12, 12, stone, ox - 9, 22, oz);
        makecyl(8, 8, 12, 12, stone, ox + 9, 22, oz);
        makecyl(8, 8, 12, 12, stone, ox, 22, oz - 9);
        makecyl(8, 8, 12, 12, stone, ox, 22, oz + 9);

        // Battlements on each lobe
        makecyl(8, 8, 2, 12, darkstone, ox - 9, 29, oz);
        makecyl(8, 8, 2, 12, darkstone, ox + 9, 29, oz);
        makecyl(8, 8, 2, 12, darkstone, ox, 29, oz - 9);
        makecyl(8, 8, 2, 12, darkstone, ox, 29, oz + 9);

        // Gate passage — south lobe entrance
        makebox(4, 5, 3, darkstone, ox, 17, oz + 15);

        // Interior walls visible (shell keep is hollow)
        makebox(14, 8, 1, stone, ox, 22, oz - 6);
        makebox(14, 8, 1, stone, ox, 22, oz + 6);
        makebox(1, 8, 14, stone, ox - 6, 22, oz);
        makebox(1, 8, 14, stone, ox + 6, 22, oz);

        // Stairs up motte — timber steps
        makebox(4, 1, 20, motte, ox - 2, 9, oz + 18);
        makebox(4, 1, 20, motte, ox - 2, 12, oz + 15);
        makebox(4, 1, 20, motte, ox - 2, 15, oz + 12);
    }

    function buildJorvikRoman() {
        var ox = 15360 - 100;
        var oz = 200;
        var stone = 0x9a8870;
        var roman = 0xcc9966;
        var timber = 0x5c3d1e;
        var soil = 0x7a6040;
        var hypocaust = 0xbb8855;

        // Excavated pit — sunken area
        makebox(40, 1, 40, soil, ox, -1.5, oz);

        // Roman column bases — hypocaust pillars
        var ci, cj;
        for (ci = 0; ci < 4; ci++) {
            for (cj = 0; cj < 4; cj++) {
                makecyl(0.5, 0.6, 1.5, 8, roman, ox - 12 + ci * 8, 0.5, oz - 12 + cj * 8);
            }
        }

        // Hypocaust raised floor tiles
        makebox(30, 0.4, 30, hypocaust, ox, 1.8, oz);

        // Roman column stumps standing
        makecyl(1.2, 1.4, 4, 8, roman, ox - 14, 2, oz - 14);
        makecyl(1.2, 1.4, 4, 8, roman, ox + 14, 2, oz - 14);
        makecyl(1.2, 1.4, 6, 8, roman, ox - 14, 3, oz + 14);
        // Capital block
        makebox(3, 1, 3, roman, ox - 14, 6.5, oz + 14);
        makebox(3, 1, 3, roman, ox - 14, 5.5, oz - 14);
        makebox(3, 1, 3, roman, ox + 14, 5.5, oz - 14);

        // Viking timber buildings overlay
        makebox(14, 6, 10, timber, ox + 16, 3, oz - 5);
        makebox(14, 2, 10, soil, ox + 16, 7, oz - 5);
        // Wattle walls
        makebox(0.5, 6, 10, timber, ox + 9, 3, oz - 5);
        makebox(0.5, 6, 10, timber, ox + 23, 3, oz - 5);
        makebox(14, 6, 0.5, timber, ox + 16, 3, oz);
        makebox(14, 6, 0.5, timber, ox + 16, 3, oz - 10);

        // Second Viking building
        makebox(12, 5, 8, timber, ox + 16, 2.5, oz + 14);
        makebox(12, 1.5, 8, soil, ox + 16, 5.5, oz + 14);

        // Archaeological information boards (flat panels)
        makebox(4, 3, 0.2, 0x2244aa, ox - 22, 2, oz - 20);
        makebox(4, 3, 0.2, 0x2244aa, ox - 22, 2, oz + 20);

        // Multangular Tower — Roman tower in Museum Gardens
        var mtx = ox - 60;
        var mtz = oz - 60;
        makecyl(6, 7, 14, 10, roman, mtx, 7, mtz);
        makebox(8, 14, 8, roman, mtx + 6, 7, mtz);
        makecyl(6, 6, 2, 10, 0x8a7a60, mtx, 15, mtz);
        makecone(5, 6, 10, 0x7a7a70, mtx, 18, mtz);

        // Museum Gardens wall stub
        makebox(30, 4, 2, roman, mtx + 10, 2, mtz);
    }

    function buildRiverOuse() {
        var ox = 15360;
        var oz = -50;
        var water = 0x2266aa;
        var stone = 0x888880;
        var iron = 0x445566;

        // River Ouse — runs roughly north-south through city
        makebox(30, 0.5, 300, water, ox - 160, 0.1, oz);

        // Riverbanks
        makebox(6, 2, 300, stone, ox - 146, 1, oz);
        makebox(6, 2, 300, stone, ox - 174, 1, oz);

        // Lendal Bridge — iron arch bridge
        // Bridge deck
        makebox(36, 2, 12, stone, ox - 160, 4, oz - 80);
        // Iron arch spans
        makebox(36, 1, 1, iron, ox - 160, 8, oz - 77);
        makebox(36, 1, 1, iron, ox - 160, 8, oz - 83);
        // Arch curve approximation — rise
        makecyl(18, 18, 1, iron, ox - 160, 6, oz - 77);
        makecyl(18, 18, 1, iron, ox - 160, 6, oz - 83);
        // Bridge piers
        makebox(4, 6, 10, stone, ox - 145, 3, oz - 80);
        makebox(4, 6, 10, stone, ox - 175, 3, oz - 80);
        // Bridge railings
        makebox(36, 1, 0.3, iron, ox - 160, 5.5, oz - 75);
        makebox(36, 1, 0.3, iron, ox - 160, 5.5, oz - 85);
        // Lendal Tower (medieval tower at bridge end)
        makecyl(5, 6, 18, 10, stone, ox - 145, 9, oz - 80);
        makecone(4, 8, 10, 0x7a7a70, ox - 145, 22, oz - 80);

        // Skeldergate Bridge — further south
        makebox(36, 2, 10, stone, ox - 160, 4, oz + 100);
        makebox(4, 5, 10, stone, ox - 145, 2.5, oz + 100);
        makebox(4, 5, 10, stone, ox - 175, 2.5, oz + 100);
        makebox(36, 1, 0.3, iron, ox - 160, 5, oz + 95);
        makebox(36, 1, 0.3, iron, ox - 160, 5, oz + 105);

        // River boats moored
        makebox(8, 2, 3, 0x8b4513, ox - 152, 1, oz + 20);
        makebox(8, 2, 3, 0x6b3a2a, ox - 152, 1, oz + 40);
        // Mast
        makecyl(0.2, 0.2, 10, 4, 0x5c3d1e, ox - 152, 7, oz + 20);

        // King's Staith — riverside quay
        makebox(50, 1, 10, stone, ox - 148, 0.5, oz + 10);

        // Museum Gardens — greenery approximation (flat ground)
        makebox(60, 0.3, 80, 0x446633, ox - 80, 0.1, oz - 60);

        // St Mary's Abbey wall in Museum Gardens
        makebox(2, 10, 40, stone, ox - 56, 5, oz - 60);
        makebox(2, 10, 40, stone, ox - 56, 5, oz - 20);
        // Ruined arch
        makebox(8, 2, 2, stone, ox - 56, 12, oz - 40);
        makebox(2, 12, 2, stone, ox - 60, 6, oz - 40);
        makebox(2, 12, 2, stone, ox - 52, 6, oz - 40);
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
