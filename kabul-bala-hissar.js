window.KabulBalaHissar = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 24280;
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, color, x, y, z, segs) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeSphere(r, color, x, y, z, ws, hs) {
        var geo = new THREE.SphereGeometry(r, ws || 8, hs || 6);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, color, x, y, z, segs) {
        var geo = new THREE.ConeGeometry(r, h, segs || 8);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildBalaHissar();
        buildDarulAman();
        buildKabulRiver();
        buildShahDoShamshira();
        buildBaburGardens();
        buildChickenStreet();
        buildHinduKush();
        buildPuleKhishti();
        buildWazirAkbarKhan();
        buildKabulZoo();
    }

    // --- GROUND TERRAIN ---
    function buildGround() {
        // City basin ground
        makeBox(1200, 2, 1200, 0x8B7355, 0, -1, 0);
        // Elevated hill for Bala Hissar
        makeBox(180, 40, 140, 0xA08060, -380, 20, -80);
        // Hill slope
        makeBox(220, 20, 160, 0x957050, -380, 8, -80);
    }

    // --- BALA HISSAR FORTRESS ---
    // 0xD4A870 ancient mud-brick hilltop citadel
    function buildBalaHissar() {
        var c = 0xD4A870;
        var cd = 0xBB9660;
        var ci = 0xC09050;

        // Lower enclosure outer walls
        makeBox(160, 12, 8, c, -380, 46, -140);   // south wall
        makeBox(160, 12, 8, c, -380, 46, -20);    // north wall
        makeBox(8, 12, 120, c, -300, 46, -80);    // east wall
        makeBox(8, 12, 120, c, -460, 46, -80);    // west wall

        // Lower enclosure battlements
        makeBox(160, 3, 3, cd, -380, 53, -140);
        makeBox(160, 3, 3, cd, -380, 53, -20);
        makeBox(3, 3, 120, cd, -300, 53, -80);
        makeBox(3, 3, 120, cd, -460, 53, -80);

        // Upper enclosure walls (higher elevation)
        makeBox(100, 14, 6, c, -380, 64, -105);
        makeBox(100, 14, 6, c, -380, 64, -55);
        makeBox(6, 14, 50, c, -330, 64, -80);
        makeBox(6, 14, 50, c, -430, 64, -80);

        // Main north tower
        makeBox(18, 22, 18, ci, -345, 70, -108);
        // Tower top crenellations
        makeBox(18, 3, 3, cd, -345, 82, -108);
        makeBox(3, 3, 18, cd, -345, 82, -108);

        // Main south-west tower
        makeBox(18, 22, 18, ci, -418, 70, -52);
        makeBox(18, 3, 3, cd, -418, 82, -52);
        makeBox(3, 3, 18, cd, -418, 82, -52);

        // Corner watchtower NE
        makeCyl(5, 6, 18, ci, -302, 72, -22);
        makeCone(6, 4, cd, -302, 82, -22, 6);

        // Corner watchtower SW
        makeCyl(5, 6, 18, ci, -458, 72, -138);
        makeCone(6, 4, cd, -458, 82, -138, 6);

        // Citadel keep (highest point)
        makeBox(30, 18, 30, ci, -380, 80, -80);
        makeCone(16, 8, cd, -380, 98, -80, 8);

        // Inner courtyard floor
        makeBox(80, 2, 40, 0xC4A060, -380, 58, -80);

        // Gate arch base
        makeBox(20, 12, 8, ci, -380, 52, -140);
        makeBox(6, 4, 8, 0x4A3020, -380, 56, -140);

        // Rubble/damage sections
        makeBox(20, 6, 6, 0x907040, -310, 47, -60);
        makeBox(15, 4, 5, 0x907040, -440, 47, -100);
    }

    // --- DARUL AMAN PALACE ---
    // 0xD4C8B0 neoclassical European-style, war-damaged
    function buildDarulAman() {
        var c = 0xD4C8B0;
        var cd = 0xC0B49C;
        var cw = 0xB8A888;

        // Long two-storey main facade
        makeBox(200, 16, 50, c, 300, 8, 100);
        // Second storey facade
        makeBox(200, 10, 50, cd, 300, 21, 100);

        // Central portico projection
        makeBox(40, 28, 20, c, 300, 14, 78);
        // Portico columns (4)
        makeCyl(2, 2, 28, cw, 285, 14, 82, 8);
        makeCyl(2, 2, 28, cw, 295, 14, 82, 8);
        makeCyl(2, 2, 28, cw, 305, 14, 82, 8);
        makeCyl(2, 2, 28, cw, 315, 14, 82, 8);
        // Portico pediment
        makeCone(24, 12, cd, 300, 33, 78, 4);

        // Corner pavilions
        makeBox(30, 26, 30, c, 200, 13, 100);
        makeBox(30, 26, 30, c, 400, 13, 100);
        // Corner pavilion roofs
        makeCone(18, 8, cd, 200, 30, 100, 4);
        makeCone(18, 8, cd, 400, 30, 100, 4);

        // War damage - broken wall sections (lower, jagged)
        makeBox(20, 10, 50, 0xA09070, 240, 5, 100);
        makeBox(15, 14, 50, 0xA09070, 360, 7, 100);
        // Rubble piles
        makeBox(25, 4, 20, 0x907060, 340, 2, 90);
        makeBox(18, 3, 15, 0x907060, 260, 2, 90);

        // Long access avenue
        makeBox(200, 1, 14, 0x706050, 300, 0, 55);
        // Avenue trees (cones)
        makeCone(4, 10, 0x2D6020, 240, 5, 48, 6);
        makeCone(4, 10, 0x2D6020, 270, 5, 48, 6);
        makeCone(4, 10, 0x2D6020, 300, 5, 48, 6);
        makeCone(4, 10, 0x2D6020, 330, 5, 48, 6);
        makeCone(4, 10, 0x2D6020, 360, 5, 48, 6);
    }

    // --- KABUL RIVER ---
    // 0x4A7A9A river bed with embankments and bridges
    function buildKabulRiver() {
        var cw = 0x4A7A9A;
        var ce = 0x7A7060;
        var cb = 0xA09080;

        // River bed main channel
        makeBox(600, 2, 30, cw, 0, -1, 0);
        // Dry sections (sandy)
        makeBox(200, 2, 30, 0xC8B870, 150, -1, 0);
        makeBox(100, 2, 30, 0xC8B870, -250, -1, 0);

        // Concrete embankments north
        makeBox(600, 5, 8, ce, 0, 2, -20);
        // Concrete embankments south
        makeBox(600, 5, 8, ce, 0, 2, 20);
        // Embankment walls (angled retaining)
        makeBox(600, 3, 4, cb, 0, 5, -23);
        makeBox(600, 3, 4, cb, 0, 5, 23);

        // Bridge 1 - main road bridge
        makeBox(50, 3, 36, 0x9A9080, -100, 4, 0);
        // Bridge 1 piers
        makeCyl(3, 3, 8, 0x8A8070, -115, 0, -8, 6);
        makeCyl(3, 3, 8, 0x8A8070, -115, 0, 8, 6);
        makeCyl(3, 3, 8, 0x8A8070, -85, 0, -8, 6);
        makeCyl(3, 3, 8, 0x8A8070, -85, 0, 8, 6);
        // Bridge 1 railings
        makeBox(50, 2, 1, 0x706860, -100, 6, -17);
        makeBox(50, 2, 1, 0x706860, -100, 6, 17);

        // Bridge 2 - pedestrian bridge
        makeBox(40, 2, 18, 0x9A9080, 200, 4, 0);
        makeCyl(2, 2, 7, 0x8A8070, 185, 1, 0, 6);
        makeCyl(2, 2, 7, 0x8A8070, 215, 1, 0, 6);
    }

    // --- SHAH-DO SHAMSHIRA MOSQUE ---
    // 0xF5EBD8 yellow Ottoman-style, dome, minaret, over river
    function buildShahDoShamshira() {
        var c = 0xF5EBD8;
        var cd = 0xE8D8C0;
        var cdome = 0xD4C0A0;

        // Main mosque body - two storey
        makeBox(40, 10, 28, c, -50, 5, -8);
        makeBox(40, 8, 28, cd, -50, 14, -8);

        // Central dome
        makeSphere(8, cdome, -50, 24, -8, 10, 8);
        // Dome drum
        makeCyl(8, 8, 5, cdome, -50, 19, -8, 10);

        // Minaret
        makeCyl(2.5, 3, 30, c, -30, 15, -8, 8);
        // Minaret balcony
        makeCyl(4, 4, 2, cd, -30, 31, -8, 8);
        // Minaret top
        makeCone(2.5, 5, cdome, -30, 35, -8, 8);

        // Entrance portal
        makeBox(12, 12, 4, cd, -50, 6, -22);
        // Arched doorway
        makeBox(5, 8, 4, 0x806040, -50, 4, -22);

        // Decorative arcade arches
        makeBox(4, 6, 2, cd, -62, 7, -22);
        makeBox(4, 6, 2, cd, -55, 7, -22);
        makeBox(4, 6, 2, cd, -45, 7, -22);
        makeBox(4, 6, 2, cd, -38, 7, -22);

        // Small secondary dome
        makeSphere(3, cdome, -68, 16, -8, 8, 6);
        makeCyl(3, 3, 3, cdome, -68, 13, -8, 8);
    }

    // --- BABUR'S GARDENS (Bagh-e Babur) ---
    // 0x3D7A32 historic Mughal terraced gardens
    function buildBaburGardens() {
        var cg = 0x3D7A32;
        var cl = 0x2D6022;
        var ct = 0xD4C8A0;
        var cp = 0xD4B890;

        // Terraced garden platforms (3 levels)
        makeBox(120, 3, 80, cg, -150, 1, 200);
        makeBox(100, 3, 70, cl, -150, 7, 200);
        makeBox(80, 3, 60, 0x4A8A3A, -150, 13, 200);

        // Terrace retaining walls
        makeBox(120, 6, 4, ct, -150, 4, 238);
        makeBox(120, 6, 4, ct, -150, 4, 162);
        makeBox(100, 6, 4, 0xC0B490, -150, 10, 232);
        makeBox(100, 6, 4, 0xC0B490, -150, 10, 168);

        // Babur's tomb structure
        makeBox(16, 4, 16, ct, -150, 15, 200);
        makeBox(12, 6, 12, cp, -150, 21, 200);
        makeSphere(5, 0xE8DCC0, -150, 27, 200, 8, 6);

        // Mosque in garden
        makeBox(22, 8, 16, ct, -130, 11, 178);
        makeSphere(5, 0xD4C8A0, -130, 21, 178, 8, 6);
        makeCyl(1.5, 2, 18, ct, -120, 18, 178, 6);
        makeCone(2, 4, 0xC0B490, -120, 28, 178, 6);

        // Garden pavilion
        makeBox(14, 8, 14, cp, -170, 11, 220);
        makeCone(8, 5, ct, -170, 18, 220, 4);
        // Pavilion columns
        makeCyl(1, 1, 8, ct, -164, 11, 214, 6);
        makeCyl(1, 1, 8, ct, -176, 11, 214, 6);
        makeCyl(1, 1, 8, ct, -164, 11, 226, 6);
        makeCyl(1, 1, 8, ct, -176, 11, 226, 6);

        // Garden trees
        makeCone(5, 12, cg, -135, 12, 192, 6);
        makeCone(5, 12, cg, -165, 12, 208, 6);
        makeCone(4, 10, cl, -140, 8, 215, 6);
        makeCone(4, 10, cl, -158, 8, 188, 6);

        // Water channel (Mughal garden feature)
        makeBox(80, 1, 3, 0x4A7A9A, -150, 1, 200);
        makeBox(3, 1, 60, 0x4A7A9A, -150, 1, 200);
    }

    // --- CHICKEN STREET ---
    // 0xC8A858 famous bazaar street with shops
    function buildChickenStreet() {
        var cs = 0xC8A858;
        var csd = 0xB89040;
        var cw = 0xD4C880;

        // Main street surface
        makeBox(200, 1, 20, 0x7A6848, 100, 0, -150);

        // Antique shop row north side
        makeBox(180, 8, 12, cs, 100, 4, -168);
        // Shop awnings
        makeBox(180, 1, 6, csd, 100, 8, -160);
        // Shop windows/doors
        makeBox(8, 5, 2, 0x402010, 80, 3, -168);
        makeBox(8, 5, 2, 0x402010, 100, 3, -168);
        makeBox(8, 5, 2, 0x402010, 120, 3, -168);
        makeBox(8, 5, 2, 0x402010, 140, 3, -168);

        // Shop row south side
        makeBox(180, 8, 12, csd, 100, 4, -132);
        // South awnings
        makeBox(180, 1, 6, cs, 100, 8, -140);
        // South shop doors
        makeBox(8, 5, 2, 0x402010, 78, 3, -132);
        makeBox(8, 5, 2, 0x402010, 102, 3, -132);
        makeBox(8, 5, 2, 0x402010, 122, 3, -132);

        // Carpet display stall
        makeBox(8, 5, 8, cw, 160, 3, -150);
        // Rolled carpets on display
        makeCyl(1.5, 1.5, 6, 0x8B2020, 157, 3, -150, 6);
        makeCyl(1.5, 1.5, 6, 0x204080, 160, 3, -150, 6);
        makeCyl(1.5, 1.5, 6, 0xA06020, 163, 3, -150, 6);

        // Lapis lazuli gem stall
        makeBox(6, 4, 6, cw, 60, 2, -150);
        makeSphere(1.5, 0x1A3A8A, 59, 4, -150, 6, 4);
        makeSphere(1.2, 0x2A4A9A, 62, 4, -150, 6, 4);

        // Street lamp posts
        makeCyl(0.5, 0.5, 10, 0x606060, 70, 5, -150, 6);
        makeSphere(1.5, 0xFFE880, 70, 10, -150, 6, 4);
        makeCyl(0.5, 0.5, 10, 0x606060, 130, 5, -150, 6);
        makeSphere(1.5, 0xFFE880, 130, 10, -150, 6, 4);
    }

    // --- HINDU KUSH MOUNTAINS ---
    // 0x8899BB dramatic range backdrop
    function buildHinduKush() {
        var cm = 0x8899BB;
        var cs = 0xEEEEEE;
        var cd = 0x7788AA;

        // Main ridge line - large peaks
        makeBox(300, 120, 80, cm, 0, 60, -500);
        makeBox(250, 140, 70, cd, -200, 70, -520);
        makeBox(200, 110, 60, cm, 200, 55, -490);

        // Primary peaks (cones)
        makeCone(55, 140, cm, -80, 130, -500, 6);
        makeCone(45, 120, cd, -250, 120, -530, 6);
        makeCone(50, 130, cm, 120, 125, -490, 6);
        makeCone(35, 100, cd, 300, 110, -480, 6);
        makeCone(40, 110, cm, -380, 115, -540, 6);

        // Snow caps on peaks
        makeCone(25, 40, cs, -80, 190, -500, 6);
        makeCone(20, 35, cs, -250, 175, -530, 6);
        makeCone(22, 38, cs, 120, 180, -490, 6);
        makeCone(16, 30, cs, 300, 160, -480, 6);
        makeCone(18, 33, cs, -380, 168, -540, 6);

        // Secondary foothills
        makeBox(400, 50, 60, 0x6A7A8A, 0, 25, -400);
        makeBox(300, 40, 50, 0x7A8A9A, -300, 20, -390);
        makeBox(250, 45, 55, 0x6A7A8A, 300, 22, -410);

        // Mountain pass suggestion
        makeBox(40, 30, 30, 0x8899BB, -50, 15, -450);
    }

    // --- PUL-E KHISHTI MOSQUE ---
    // 0xD4C8A0 largest mosque in Kabul, blue dome, minarets
    function buildPuleKhishti() {
        var c = 0xD4C8A0;
        var cd = 0xC8BC90;
        var cdome = 0x2A4A8A;

        // Main prayer hall
        makeBox(60, 14, 50, c, 50, 7, -50);
        // Second storey arcade
        makeBox(60, 6, 50, cd, 50, 17, -50);

        // Central large dome
        makeSphere(12, cdome, 50, 27, -50, 12, 10);
        // Large dome drum
        makeCyl(12, 12, 8, 0x3A5A9A, 50, 21, -50, 12);

        // Two flanking smaller domes
        makeSphere(6, cdome, 24, 22, -50, 10, 8);
        makeCyl(6, 6, 5, 0x3A5A9A, 24, 18, -50, 10);
        makeSphere(6, cdome, 76, 22, -50, 10, 8);
        makeCyl(6, 6, 5, 0x3A5A9A, 76, 18, -50, 10);

        // Four minarets
        makeCyl(3, 3.5, 38, c, 22, 19, -28, 8);
        makeCone(3, 7, cd, 22, 39, -28, 8);
        makeCyl(3, 3.5, 38, c, 78, 19, -28, 8);
        makeCone(3, 7, cd, 78, 39, -28, 8);
        makeCyl(3, 3.5, 38, c, 22, 19, -72, 8);
        makeCone(3, 7, cd, 22, 39, -72, 8);
        makeCyl(3, 3.5, 38, c, 78, 19, -72, 8);
        makeCone(3, 7, cd, 78, 39, -72, 8);

        // Entrance iwan (portal)
        makeBox(20, 18, 6, cd, 50, 9, -76);
        makeBox(8, 12, 6, 0x302010, 50, 6, -76);

        // Courtyard
        makeBox(50, 1, 30, 0xE8E0C8, 50, 0, -90);
        // Courtyard fountain
        makeCyl(5, 5, 2, 0x4A7A9A, 50, 1, -90, 10);
        makeCyl(1, 2, 4, 0x8ABACA, 50, 3, -90, 6);
    }

    // --- WAZIR AKBAR KHAN DISTRICT ---
    // 0xD4D0C8 upscale embassy district with blast walls
    function buildWazirAkbarKhan() {
        var ce = 0xD4D0C8;
        var cbw = 0xC0BCB0;
        var cbl = 0xB0B0A0;

        // Embassy compound 1
        makeBox(50, 12, 40, ce, -200, 6, -200);
        // Blast walls around embassy 1
        makeBox(70, 8, 4, cbl, -200, 4, -225);
        makeBox(70, 8, 4, cbl, -200, 4, -175);
        makeBox(4, 8, 50, cbl, -238, 4, -200);
        makeBox(4, 8, 50, cbl, -162, 4, -200);
        // Guard tower
        makeBox(6, 16, 6, cbw, -162, 8, -225);
        makeCone(4, 4, cbl, -162, 17, -225, 4);

        // Embassy compound 2
        makeBox(40, 10, 35, ce, -280, 5, -210);
        makeBox(60, 7, 4, cbl, -280, 4, -232);
        makeBox(60, 7, 4, cbl, -280, 4, -188);
        makeBox(4, 7, 40, cbl, -312, 4, -210);
        makeBox(4, 7, 40, cbl, -248, 4, -210);

        // Embassy compound 3 (larger)
        makeBox(60, 14, 50, ce, -130, 7, -210);
        makeBox(80, 8, 4, cbl, -130, 4, -240);
        makeBox(80, 8, 4, cbl, -130, 4, -180);
        makeBox(4, 8, 60, cbl, -172, 4, -210);
        makeBox(4, 8, 60, cbl, -88, 4, -210);

        // Fortified road barrier / chicane
        makeBox(8, 4, 4, cbl, -160, 2, -250);
        makeBox(8, 4, 4, cbl, -148, 2, -246);
        makeBox(8, 4, 4, cbl, -136, 2, -250);

        // Embassy district road
        makeBox(250, 1, 18, 0x706050, -200, 0, -258);
    }

    // --- KABUL ZOO ---
    // 0x4A7A3A historic zoo with enclosures
    function buildKabulZoo() {
        var cz = 0x4A7A3A;
        var cf = 0x3A6A2A;
        var cw = 0xB0A880;

        // Zoo perimeter wall
        makeBox(120, 5, 4, cw, 200, 3, 180);
        makeBox(120, 5, 4, cw, 200, 3, 300);
        makeBox(4, 5, 120, cw, 138, 3, 240);
        makeBox(4, 5, 120, cw, 262, 3, 240);

        // Main zoo ground
        makeBox(120, 1, 120, cz, 200, 0, 240);

        // Lion enclosure
        makeBox(25, 4, 20, cf, 175, 2, 210);
        makeBox(25, 3, 2, 0x888060, 175, 2, 200);
        makeBox(25, 3, 2, 0x888060, 175, 2, 220);
        makeBox(2, 3, 20, 0x888060, 163, 2, 210);
        makeBox(2, 3, 20, 0x888060, 187, 2, 210);
        // Lion shelter box
        makeBox(8, 5, 8, cw, 172, 3, 213);

        // Bird aviary (tall cage)
        makeBox(18, 10, 18, cf, 230, 5, 210);
        makeCone(10, 6, 0x888060, 230, 12, 210, 6);

        // Deer enclosure
        makeBox(20, 3, 20, cf, 175, 2, 270);
        makeBox(2, 3, 20, 0x888060, 165, 2, 270);
        makeBox(2, 3, 20, 0x888060, 185, 2, 270);

        // Zoo garden trees
        makeCone(4, 9, cz, 210, 5, 250, 6);
        makeCone(5, 11, cf, 240, 6, 260, 6);
        makeCone(4, 9, cz, 220, 5, 235, 6);
        makeCone(3, 8, cf, 200, 4, 270, 6);

        // Zoo entrance gate
        makeBox(20, 8, 4, cw, 200, 4, 178);
        makeCyl(2, 2, 8, cw, 190, 4, 178, 6);
        makeCyl(2, 2, 8, cw, 210, 4, 178, 6);
        makeSphere(2, 0xFFDD00, 190, 9, 178, 6, 4);
        makeSphere(2, 0xFFDD00, 210, 9, 178, 6, 4);

        // Reptile house
        makeBox(22, 5, 14, cw, 242, 3, 278);
        makeCone(12, 5, cf, 242, 8, 278, 6);

        // Admin building
        makeBox(16, 8, 12, cw, 255, 4, 215);
        makeCone(9, 4, cf, 255, 10, 215, 4);
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
