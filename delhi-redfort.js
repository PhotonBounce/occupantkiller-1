window.DelhiRedfort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 24360;
    var BASE_Y = 0;
    var BASE_Z = 0;

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

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function cyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function sph(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildRedFort();
        buildIndiaGate();
        buildQutubMinar();
        buildParliamentHouse();
        buildHumayunsTomb();
        buildLotusTemple();
        buildChandniChowk();
        buildConnaughtPlace();
        buildYamunaRiver();
        buildAkshardhamTemple();
    }

    function buildGround() {
        // Ground plane approximated with a large flat box
        box(2400, 1, 2400, 0x8B7355, 0, -0.5, 0);
        // Roads - main boulevards
        box(2400, 0.5, 18, 0x555555, 0, 0.1, 0);
        box(18, 0.5, 2400, 0x555555, 0, 0.1, 0);
        box(2400, 0.5, 18, 0x555555, 0, 0.1, 200);
        box(2400, 0.5, 18, 0x555555, 0, 0.1, -200);
    }

    function buildRedFort() {
        // Red Fort at offset (-600, 0, -300) from base
        var rx = -600;
        var rz = -300;
        var wallColor = 0xCC4444;
        var marbleColor = 0xF5F0E8;
        var archColor = 0xBB3333;

        // Main perimeter walls - 4 sides, 30m high
        box(240, 30, 8, wallColor, rx, 15, rz - 120);       // North wall
        box(240, 30, 8, wallColor, rx, 15, rz + 120);       // South wall
        box(8, 30, 240, wallColor, rx - 120, 15, rz);       // West wall
        box(8, 30, 240, wallColor, rx + 120, 15, rz);       // East wall

        // Crenellations - North wall merlons
        for (var i = -5; i <= 5; i++) {
            box(8, 4, 4, wallColor, rx + i * 20, 32, rz - 120);
        }
        // Crenellations - South wall merlons
        for (var j = -5; j <= 5; j++) {
            box(8, 4, 4, wallColor, rx + j * 20, 32, rz + 120);
        }
        // Crenellations - West wall merlons
        for (var k = -5; k <= 5; k++) {
            box(4, 4, 8, wallColor, rx - 120, 32, rz + k * 20);
        }
        // Crenellations - East wall merlons
        for (var m = -5; m <= 5; m++) {
            box(4, 4, 8, wallColor, rx + 120, 32, rz + m * 20);
        }

        // Octagonal corner towers
        cyl(12, 14, 36, 8, wallColor, rx - 120, 18, rz - 120);
        cyl(12, 14, 36, 8, wallColor, rx + 120, 18, rz - 120);
        cyl(12, 14, 36, 8, wallColor, rx - 120, 18, rz + 120);
        cyl(12, 14, 36, 8, wallColor, rx + 120, 18, rz + 120);

        // Tower domes
        sph(7, 8, 8, marbleColor, rx - 120, 38, rz - 120);
        sph(7, 8, 8, marbleColor, rx + 120, 38, rz - 120);
        sph(7, 8, 8, marbleColor, rx - 120, 38, rz + 120);
        sph(7, 8, 8, marbleColor, rx + 120, 38, rz + 120);

        // Lahori Gate (main west entrance) - grand arched gateway
        box(30, 35, 14, wallColor, rx - 120, 17.5, rz);
        box(12, 25, 16, archColor, rx - 120, 12.5, rz);     // Gate arch opening (darker)
        // Lahori Gate chhatris (kiosks) on top
        cyl(4, 4, 8, wallColor, rx - 126, 39, rz - 6);
        cyl(4, 4, 8, wallColor, rx - 114, 39, rz + 6);
        cone(4, 6, 8, marbleColor, rx - 126, 46, rz - 6);
        cone(4, 6, 8, marbleColor, rx - 114, 46, rz + 6);

        // Delhi Gate (south entrance)
        box(24, 30, 14, wallColor, rx, 15, rz + 120);
        box(10, 22, 16, archColor, rx, 11, rz + 120);

        // Diwan-i-Aam (Hall of Public Audience) - large columned hall
        box(80, 12, 40, 0xDDCCBB, rx - 20, 6, rz - 20);
        box(80, 14, 4, 0xDDAA88, rx - 20, 7, rz - 40);     // Front colonnade base
        for (var ci = -3; ci <= 3; ci++) {
            cyl(1.5, 1.5, 12, 6, 0xEEDDBB, rx + ci * 12 - 20, 6, rz - 40);
        }

        // Diwan-i-Khas (Hall of Private Audience) - marble with throne
        box(40, 15, 30, marbleColor, rx + 50, 7.5, rz - 30);
        box(10, 4, 8, 0xF0E0B0, rx + 50, 17, rz - 30);     // Marble throne dais
        sph(3, 6, 6, 0xFFD700, rx + 50, 22, rz - 30);      // Golden dome

        // Hammam (Royal Baths) - octagonal chambers
        box(30, 10, 30, 0xDDB88A, rx + 60, 5, rz + 30);
        cyl(8, 8, 10, 8, 0xCCAA77, rx + 60, 5, rz + 30);

        // Rang Mahal (Palace of Colors) - inner palace
        box(50, 18, 35, 0xF0E8D8, rx - 30, 9, rz + 40);
        sph(10, 8, 8, marbleColor, rx - 30, 22, rz + 40);

        // Naubat Khana (drum house) above Lahori Gate
        box(20, 8, 12, 0xCC7755, rx - 120, 38, rz);
    }

    function buildIndiaGate() {
        // India Gate at offset (0, 0, 300) from base
        var ix = 0;
        var iz = 300;
        var archColor = 0xC8B870;
        var poolColor = 0x2A5A7A;

        // Main arch - two massive piers
        box(12, 42, 14, archColor, ix - 16, 21, iz);    // Left pier
        box(12, 42, 14, archColor, ix + 16, 21, iz);    // Right pier
        // Arch lintel spanning top
        box(44, 8, 14, archColor, ix, 38, iz);
        // Arch soffit (underside detail)
        box(20, 6, 12, 0xBBA860, ix, 32, iz);

        // Attic/top inscription block
        box(44, 4, 14, 0xBBA860, ix, 44, iz);

        // Plinth / base steps - 3 tiers
        box(80, 3, 80, archColor, ix, 1.5, iz);
        box(70, 3, 70, archColor, ix, 4.5, iz);
        box(60, 3, 60, archColor, ix, 7.5, iz);

        // Star of India base platform
        box(20, 2, 20, 0xAA9960, ix, 9.5, iz);

        // Amar Jawan Jyoti (Eternal Flame) plinth
        box(4, 3, 4, 0x333333, ix, 11, iz);
        // Flame represented as cone + sphere
        cone(1.5, 4, 6, 0xFF6600, ix, 14.5, iz);
        sph(1.2, 6, 6, 0xFF4400, ix, 17, iz);

        // Hexagonal reflecting pool - approximated with boxes
        box(120, 1, 6, poolColor, ix, 0.3, iz - 70);
        box(120, 1, 6, poolColor, ix, 0.3, iz + 70);
        box(6, 1, 140, poolColor, ix - 60, 0.3, iz);
        box(6, 1, 140, poolColor, ix + 60, 0.3, iz);
        box(90, 1, 6, poolColor, ix - 35, 0.3, iz - 50);
        box(90, 1, 6, poolColor, ix + 35, 0.3, iz + 50);

        // Pool edge/surround
        box(130, 1.5, 3, 0xC8B870, ix, 0.5, iz - 73);
        box(130, 1.5, 3, 0xC8B870, ix, 0.5, iz + 73);

        // Lamp posts around India Gate
        for (var lp = -3; lp <= 3; lp++) {
            cyl(0.4, 0.4, 10, 6, 0x888877, ix + lp * 30, 5, iz - 100);
            sph(1.2, 6, 6, 0xFFFFCC, ix + lp * 30, 11, iz - 100);
        }

        // Rajpath (now Kartavya Path) - ceremonial boulevard
        box(600, 0.5, 40, 0x888877, ix + 200, 0.2, iz);
        box(600, 0.5, 4, 0x667755, ix + 200, 0.2, iz - 25);
        box(600, 0.5, 4, 0x667755, ix + 200, 0.2, iz + 25);
    }

    function buildQutubMinar() {
        // Qutub Minar at offset (-400, 0, 600) from base
        var qx = -400;
        var qz = 600;
        var minarColor = 0xC8784A;
        var ironColor = 0x4A4A3A;

        // 5-storey tapered minaret — each storey narrower toward top
        // Storey 1 - widest base
        cyl(9, 14, 22, 16, minarColor, qx, 11, qz);
        // Balcony 1
        cyl(10, 10, 2, 16, 0xAA6633, qx, 23, qz);
        // Storey 2
        cyl(7, 9, 15, 16, minarColor, qx, 30.5, qz);
        // Balcony 2
        cyl(8, 8, 2, 16, 0xAA6633, qx, 38.5, qz);
        // Storey 3
        cyl(5.5, 7, 12, 16, minarColor, qx, 45, qz);
        // Balcony 3
        cyl(6.5, 6.5, 2, 16, 0xAA6633, qx, 51.5, qz);
        // Storey 4 - marble (white)
        cyl(4, 5.5, 10, 16, 0xF5F0E8, qx, 57, qz);
        // Balcony 4
        cyl(5, 5, 2, 12, 0xDDCCBB, qx, 62.5, qz);
        // Storey 5 - marble top
        cyl(3, 4, 9, 12, 0xF5F0E8, qx, 67, qz);
        // Cupola / chhatri cap
        cyl(4, 4, 2, 12, 0xEEDDBB, qx, 72, qz);
        sph(3, 8, 8, 0xF5F0E8, qx, 74.5, qz);
        cone(2, 4, 8, 0xC8784A, qx, 77.5, qz);

        // Iron Pillar of Delhi
        cyl(0.5, 0.7, 7.2, 8, ironColor, qx + 20, 3.6, qz + 10);
        // Iron pillar capital
        cyl(0.8, 0.5, 1.5, 8, ironColor, qx + 20, 7.8, qz + 10);
        sph(0.8, 6, 6, ironColor, qx + 20, 8.7, qz + 10);

        // Quwwat-ul-Islam Mosque ruins
        box(50, 8, 6, 0xBB8855, qx + 25, 4, qz - 20);
        box(6, 12, 6, 0xBB8855, qx + 10, 6, qz - 20);
        box(6, 12, 6, 0xBB8855, qx + 25, 6, qz - 20);
        box(6, 12, 6, 0xBB8855, qx + 40, 6, qz - 20);

        // Alai Darwaza (gateway)
        box(18, 14, 16, 0xCC7755, qx - 25, 7, qz - 30);
        sph(6, 8, 8, 0xCCAA88, qx - 25, 17, qz - 30);
        box(8, 10, 18, 0xAA6644, qx - 25, 5, qz - 30);

        // Outer enclosure wall segments
        box(120, 5, 3, 0xBB9966, qx, 2.5, qz - 60);
        box(3, 5, 80, 0xBB9966, qx - 60, 2.5, qz - 20);
    }

    function buildParliamentHouse() {
        // Parliament House at offset (200, 0, -100)
        var px = 200;
        var pz = -100;
        var parColor = 0xD4C8A0;
        var colColor = 0xCCBB99;

        // Main circular drum body
        cyl(60, 60, 20, 24, parColor, px, 10, pz);
        // Top parapet
        cyl(61, 61, 3, 24, 0xC4B890, px, 21.5, pz);

        // 144 columns around perimeter (approximated with grouped cylinders)
        var numCols = 24;
        for (var ci2 = 0; ci2 < numCols; ci2++) {
            var angle = (ci2 / numCols) * Math.PI * 2;
            var colX = Math.cos(angle) * 58;
            var colZ = Math.sin(angle) * 58;
            cyl(1.2, 1.2, 18, 8, colColor, px + colX, 9, pz + colZ);
        }

        // Central dome
        sph(20, 12, 12, parColor, px, 28, pz);

        // Three chambers (Lok Sabha, Rajya Sabha, Library) as internal boxes
        box(30, 12, 25, 0xCCBB99, px - 20, 6, pz - 10);
        box(30, 12, 25, 0xCCBB99, px + 20, 6, pz + 10);
        box(20, 10, 20, 0xBBAA88, px, 5, pz + 40);

        // Sansad Marg gate entrance
        box(16, 8, 8, parColor, px - 70, 4, pz);
        cyl(2, 2, 8, 6, colColor, px - 75, 4, pz - 5);
        cyl(2, 2, 8, 6, colColor, px - 75, 4, pz + 5);
    }

    function buildHumayunsTomb() {
        // Humayun's Tomb at offset (400, 0, 400)
        var hx = 400;
        var hz = 400;
        var redColor = 0x998877;
        var marbleColor = 0xF5F0E8;

        // High rubble-masonry platform (char bagh platform)
        box(120, 8, 120, redColor, hx, 4, hz);

        // Central tomb structure - main body
        box(60, 18, 60, redColor, hx, 17, hz);
        // Arched recesses on each face
        box(20, 14, 4, 0x887766, hx, 15, hz - 30);
        box(20, 14, 4, 0x887766, hx, 15, hz + 30);
        box(4, 14, 20, 0x887766, hx - 30, 15, hz);
        box(4, 14, 20, 0x887766, hx + 30, 15, hz);

        // Octagonal drum below dome
        cyl(22, 25, 8, 8, redColor, hx, 30, hz);

        // Double dome - outer dome
        sph(20, 10, 10, marbleColor, hx, 42, hz);
        // Inner dome (slightly smaller, offset up)
        sph(14, 8, 8, marbleColor, hx, 46, hz);
        // Finial
        cyl(1, 1, 5, 6, 0xC8A060, hx, 63, hz);
        sph(1.5, 6, 6, 0xFFD700, hx, 66, hz);

        // Corner kiosks/chhatris - 4 octagonal pavilions
        cyl(6, 8, 10, 8, redColor, hx - 25, 13, hz - 25);
        sph(5, 6, 6, marbleColor, hx - 25, 20, hz - 25);
        cyl(6, 8, 10, 8, redColor, hx + 25, 13, hz - 25);
        sph(5, 6, 6, marbleColor, hx + 25, 20, hz - 25);
        cyl(6, 8, 10, 8, redColor, hx - 25, 13, hz + 25);
        sph(5, 6, 6, marbleColor, hx - 25, 20, hz + 25);
        cyl(6, 8, 10, 8, redColor, hx + 25, 13, hz + 25);
        sph(5, 6, 6, marbleColor, hx + 25, 20, hz + 25);

        // Chaharbagh garden paths (4 quadrant paths)
        box(120, 0.5, 4, 0x998866, hx, 8.5, hz);
        box(4, 0.5, 120, 0x998866, hx, 8.5, hz);

        // Entry gateway (Bu Halima's Gateway)
        box(20, 14, 8, redColor, hx - 70, 7, hz);
        box(8, 10, 10, 0x887766, hx - 70, 5, hz);
    }

    function buildLotusTemple() {
        // Lotus Temple at offset (600, 0, 200)
        var lx = 600;
        var lz = 200;
        var petalColor = 0xFFFFFF;
        var podColor = 0xF0F0F0;

        // Base platform
        cyl(50, 55, 4, 18, 0xE8E8E8, lx, 2, lz);
        cyl(40, 45, 3, 18, 0xF0F0F0, lx, 5.5, lz);

        // 27 petals in 3 tiers of 9 each — using cone and sphere shapes
        // Outer tier - 9 petals
        for (var p1 = 0; p1 < 9; p1++) {
            var a1 = (p1 / 9) * Math.PI * 2;
            var px1 = Math.cos(a1) * 28;
            var pz1 = Math.sin(a1) * 28;
            cone(5, 22, 6, petalColor, lx + px1, 12, lz + pz1);
        }
        // Middle tier - 9 petals
        for (var p2 = 0; p2 < 9; p2++) {
            var a2 = (p2 / 9) * Math.PI * 2 + 0.35;
            var px2 = Math.cos(a2) * 20;
            var pz2 = Math.sin(a2) * 20;
            cone(4, 20, 6, petalColor, lx + px2, 14, lz + pz2);
        }
        // Inner tier - 9 petals
        for (var p3 = 0; p3 < 9; p3++) {
            var a3 = (p3 / 9) * Math.PI * 2 + 0.7;
            var px3 = Math.cos(a3) * 12;
            var pz3 = Math.sin(a3) * 12;
            cone(3, 16, 6, petalColor, lx + px3, 18, lz + pz3);
        }

        // Central hall dome
        sph(10, 12, 12, 0xF8F8FF, lx, 28, lz);

        // 9 surrounding pods
        for (var pod = 0; pod < 9; pod++) {
            var ap = (pod / 9) * Math.PI * 2;
            var podX = Math.cos(ap) * 38;
            var podZ = Math.sin(ap) * 38;
            cyl(5, 6, 8, 8, podColor, lx + podX, 4, lz + podZ);
            sph(5, 6, 6, podColor, lx + podX, 9, lz + podZ);
        }

        // Reflecting pools around lotus
        box(140, 1, 12, 0x2A5A7A, lx, 0.5, lz - 60);
        box(140, 1, 12, 0x2A5A7A, lx, 0.5, lz + 60);
    }

    function buildChandniChowk() {
        // Chandni Chowk at offset (-600, 0, 100) — extends east from Red Fort
        var cx = -450;
        var cz = 100;
        var bazaarColor = 0xC8A870;
        var shopColor = 0xBB9955;

        // Main street - long boulevard
        box(400, 0.5, 25, 0x777766, cx + 200, 0.2, cz);

        // Spice Market cluster
        box(40, 8, 30, bazaarColor, cx, 4, cz - 40);
        box(40, 6, 30, 0xBB8844, cx + 50, 3, cz - 40);
        box(35, 7, 25, 0xCC9955, cx - 50, 3.5, cz - 40);

        // Textile market buildings
        box(60, 10, 30, bazaarColor, cx + 100, 5, cz + 40);
        box(50, 9, 25, shopColor, cx + 160, 4.5, cz + 40);

        // Dense shop rows along street - north side
        for (var sh = 0; sh < 8; sh++) {
            box(20, 6, 12, bazaarColor, cx + sh * 22 - 80, 3, cz - 18);
        }
        // Dense shop rows along street - south side
        for (var sh2 = 0; sh2 < 8; sh2++) {
            box(20, 6, 12, shopColor, cx + sh2 * 22 - 80, 3, cz + 18);
        }

        // Fatehpuri Mosque at west end
        box(35, 14, 30, 0xDDCCBB, cx - 180, 7, cz);
        sph(8, 8, 8, 0xEEDDBB, cx - 180, 18, cz);
        cyl(2, 2, 18, 8, 0xDDCCBB, cx - 195, 9, cz - 10);
        cyl(2, 2, 18, 8, 0xDDCCBB, cx - 165, 9, cz + 10);

        // Sis Ganj Gurudwara - golden dome Sikh temple
        box(25, 16, 25, 0xCCBB99, cx + 80, 8, cz);
        sph(8, 8, 8, 0xFFD700, cx + 80, 20, cz);

        // Overhead wires / canopy structures (boxes at height)
        box(400, 1, 3, 0x333322, cx + 200, 8, cz - 10);
        box(400, 1, 3, 0x333322, cx + 200, 8, cz + 10);
    }

    function buildConnaughtPlace() {
        // Connaught Place at offset (200, 0, 100)
        var cpx = 200;
        var cpz = 100;
        var colonColor = 0xCCCCCC;

        // Outer ring of Georgian colonnade buildings
        var numBlocks = 12;
        for (var cb = 0; cb < numBlocks; cb++) {
            var angle = (cb / numBlocks) * Math.PI * 2;
            var bx = Math.cos(angle) * 80;
            var bz = Math.sin(angle) * 80;
            box(28, 12, 16, colonColor, cpx + bx, 6, cpz + bz);
            // Colonnade columns in front of each block
            cyl(1, 1, 10, 6, 0xDDDDDD, cpx + bx + Math.cos(angle) * 9, 5, cpz + bz + Math.sin(angle) * 9);
        }

        // Inner ring - smaller colonnade
        for (var cb2 = 0; cb2 < numBlocks; cb2++) {
            var angle2 = (cb2 / numBlocks) * Math.PI * 2 + 0.26;
            var bx2 = Math.cos(angle2) * 50;
            var bz2 = Math.sin(angle2) * 50;
            box(22, 10, 14, 0xBBBBBB, cpx + bx2, 5, cpz + bz2);
        }

        // Central park
        cyl(20, 20, 1, 12, 0x447744, cpx, 0.5, cpz);
        // Central fountain
        cyl(8, 8, 2, 12, 0x6688AA, cpx, 1, cpz);
        cyl(4, 4, 4, 12, 0x7799BB, cpx, 2, cpz);
        sph(3, 8, 8, 0xAABBCC, cpx, 5, cpz);

        // Rajiv Chowk roads radiating out
        box(200, 0.5, 12, 0x666666, cpx + 140, 0.2, cpz);
        box(200, 0.5, 12, 0x666666, cpx - 140, 0.2, cpz);
        box(12, 0.5, 200, 0x666666, cpx, 0.2, cpz + 140);
        box(12, 0.5, 200, 0x666666, cpx, 0.2, cpz - 140);
    }

    function buildYamunaRiver() {
        // Yamuna River at offset (800, 0, 0) — runs north-south
        var yx = 800;
        var riverColor = 0x2A5A7A;
        var sandColor = 0xC8B890;

        // River body - deep blue
        box(120, 1, 1200, riverColor, yx, 0.3, 0);

        // River banks / sandy ghats
        box(30, 0.8, 1200, sandColor, yx - 75, 0.2, 0);
        box(30, 0.8, 1200, sandColor, yx + 75, 0.2, 0);

        // Stepped ghats (bathing platforms) — west bank
        box(20, 1, 40, 0xC0A878, yx - 70, 0.5, -200);
        box(20, 1, 40, 0xB89868, yx - 65, 1, -200);
        box(20, 1, 40, 0xAA8858, yx - 60, 1.5, -200);

        box(20, 1, 40, 0xC0A878, yx - 70, 0.5, 0);
        box(20, 1, 40, 0xB89868, yx - 65, 1, 0);
        box(20, 1, 40, 0xAA8858, yx - 60, 1.5, 0);

        box(20, 1, 40, 0xC0A878, yx - 70, 0.5, 200);
        box(20, 1, 40, 0xB89868, yx - 65, 1, 200);
        box(20, 1, 40, 0xAA8858, yx - 60, 1.5, 200);

        // Yamuna Bridge
        box(180, 4, 14, 0x888888, yx, 2, -100);
        cyl(3, 3, 6, 8, 0x777777, yx - 60, 3, -100);
        cyl(3, 3, 6, 8, 0x777777, yx, 3, -100);
        cyl(3, 3, 6, 8, 0x777777, yx + 60, 3, -100);

        // Small boats on river
        box(8, 2, 3, 0x885533, yx + 10, 1, 50);
        box(8, 2, 3, 0x664422, yx - 15, 1, -50);
    }

    function buildAkshardhamTemple() {
        // Akshardham at offset (700, 0, -400)
        var ax = 700;
        var az = -400;
        var sandColor = 0xD4A870;
        var marbleColor = 0xF5F0E8;

        // High terrace platform
        box(200, 6, 160, sandColor, ax, 3, az);

        // Main monument (Mandir) - central large structure
        box(80, 30, 60, sandColor, ax, 21, az);

        // Main shikhara (spire) - central tower
        cyl(10, 16, 30, 8, sandColor, ax, 45, az);
        cyl(7, 10, 10, 8, 0xC89858, ax, 65, az);
        sph(5, 8, 8, 0xCC9944, ax, 75, az);
        cone(3, 6, 8, 0xDD9933, ax, 79, az);

        // 4 corner shikharas
        cyl(5, 8, 18, 8, sandColor, ax - 30, 39, az - 20);
        sph(4, 6, 6, 0xC89858, ax - 30, 49, az - 20);
        cone(2.5, 5, 8, 0xDD9933, ax - 30, 52.5, az - 20);

        cyl(5, 8, 18, 8, sandColor, ax + 30, 39, az - 20);
        sph(4, 6, 6, 0xC89858, ax + 30, 49, az - 20);
        cone(2.5, 5, 8, 0xDD9933, ax + 30, 52.5, az - 20);

        cyl(5, 8, 18, 8, sandColor, ax - 30, 39, az + 20);
        sph(4, 6, 6, 0xC89858, ax - 30, 49, az + 20);
        cone(2.5, 5, 8, 0xDD9933, ax - 30, 52.5, az + 20);

        cyl(5, 8, 18, 8, sandColor, ax + 30, 39, az + 20);
        sph(4, 6, 6, 0xC89858, ax + 30, 49, az + 20);
        cone(2.5, 5, 8, 0xDD9933, ax + 30, 52.5, az + 20);

        // 234 pillars — approximated with rings of cylinders
        var numPillars = 24;
        for (var pi2 = 0; pi2 < numPillars; pi2++) {
            var pa = (pi2 / numPillars) * Math.PI * 2;
            var ppx = Math.cos(pa) * 90;
            var ppz = Math.sin(pa) * 90;
            cyl(1.5, 1.5, 12, 6, 0xC49055, ax + ppx, 6, az + ppz);
        }

        // Narayan Sarovar (moat/pond)
        box(220, 1, 14, 0x2A5A7A, ax, 0.5, az - 90);
        box(220, 1, 14, 0x2A5A7A, ax, 0.5, az + 90);
        box(14, 1, 160, 0x2A5A7A, ax - 105, 0.5, az);
        box(14, 1, 160, 0x2A5A7A, ax + 105, 0.5, az);

        // Musical Fountain area
        cyl(25, 25, 1.5, 16, 0x336688, ax, 0.5, az + 120);

        // Swaminarayan Akshardham gate (main entrance)
        box(30, 16, 10, sandColor, ax, 8, az - 90);
        box(12, 12, 12, 0xBB8844, ax, 6, az - 90);
        // Gate minarets
        cyl(2.5, 3, 16, 8, sandColor, ax - 16, 8, az - 90);
        cyl(2.5, 3, 16, 8, sandColor, ax + 16, 8, az - 90);
        sph(3, 6, 6, 0xCC9944, ax - 16, 17, az - 90);
        sph(3, 6, 6, 0xCC9944, ax + 16, 17, az - 90);

        // Elephant carvings / statues at base (approximated as boxes + spheres)
        box(5, 4, 8, 0x998877, ax - 85, 5, az - 75);
        sph(3, 6, 6, 0x887766, ax - 82, 7, az - 75);
        box(5, 4, 8, 0x998877, ax + 85, 5, az - 75);
        sph(3, 6, 6, 0x887766, ax + 82, 7, az - 75);

        // Exhibition Halls (below ground level in real life — shown above here)
        box(60, 8, 40, 0xBB9966, ax - 70, 4, az + 50);
        box(60, 8, 40, 0xBB9966, ax + 70, 4, az + 50);
    }

    function update(delta) {
        // No per-frame animation required
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
