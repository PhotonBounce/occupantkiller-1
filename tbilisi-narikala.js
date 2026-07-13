window.TbilisiNarikala = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 23680;
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

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildKuraRiver();
        buildNarikalaFortress();
        buildOldTown();
        buildMetekhiChurch();
        buildMtatsmindaFunicular();
        buildMotherOfGeorgia();
        buildPeaceBridge();
        buildGeorgianNationalMuseum();
        buildHolyTrinityCathedral();
        buildRustaveliAvenue();
        buildHillTerrain();
    }

    // --- KURA (MTKVARI) RIVER ---
    function buildKuraRiver() {
        // Main river channel running east-west through the gorge
        makeBox(600, 4, 60, 0x2A5A8A, 0, -8, 0);
        // River surface shimmer strips
        makeBox(580, 1, 10, 0x3A6A9A, 0, -5, -15);
        makeBox(580, 1, 10, 0x3A6A9A, 0, -5, 15);
        makeBox(580, 1, 8, 0x2060A0, 0, -5, 0);
        // Gorge walls north
        makeBox(600, 40, 20, 0x8B7355, 0, 12, -48);
        // Gorge walls south
        makeBox(600, 40, 20, 0x8B7355, 0, 12, 48);
        // River bed rocks
        makeBox(12, 3, 8, 0x6B5D4A, -80, -7, 5);
        makeBox(8, 2, 6, 0x6B5D4A, 40, -7, -8);
        makeBox(10, 3, 7, 0x6B5D4A, 120, -7, 10);
    }

    // --- NARIKALA FORTRESS ---
    function buildNarikalaFortress() {
        var col = 0xD4C8A0;
        var darkStone = 0xA09070;
        // Main hilltop base / cliff platform
        makeBox(120, 18, 80, 0x9B8C70, -160, 20, -60);
        // Lower curtain wall west
        makeBox(5, 20, 80, col, -210, 28, -60);
        // Lower curtain wall east
        makeBox(5, 20, 80, col, -110, 28, -60);
        // Lower curtain wall north
        makeBox(100, 20, 5, col, -160, 28, -98);
        // Lower curtain wall south
        makeBox(100, 20, 5, col, -160, 28, -22);
        // Main gate tower south-east
        makeCyl(6, 7, 24, 8, col, -114, 38, -22);
        makeCone(7, 8, 8, darkStone, -114, 52, -22);
        // Main gate tower south-west
        makeCyl(6, 7, 24, 8, col, -206, 38, -22);
        makeCone(7, 8, 8, darkStone, -206, 52, -22);
        // Upper fortress walls (upper terrace)
        makeBox(80, 15, 5, col, -160, 46, -100);
        makeBox(80, 15, 5, col, -160, 46, -48);
        makeBox(5, 15, 52, col, -118, 46, -74);
        makeBox(5, 15, 52, col, -202, 46, -74);
        // Main keep tower north-west
        makeCyl(7, 8, 28, 8, col, -198, 52, -96);
        makeCone(8, 10, 8, darkStone, -198, 67, -96);
        // Main keep tower north-east
        makeCyl(7, 8, 28, 8, col, -122, 52, -96);
        makeCone(8, 10, 8, darkStone, -122, 67, -96);
        // Large central watch tower
        makeCyl(9, 10, 36, 8, col, -160, 56, -74);
        makeCone(10, 12, 8, darkStone, -160, 74, -74);
        // Battlement merlons along south wall
        makeBox(4, 5, 4, col, -130, 39, -22);
        makeBox(4, 5, 4, col, -145, 39, -22);
        makeBox(4, 5, 4, col, -160, 39, -22);
        makeBox(4, 5, 4, col, -175, 39, -22);
        makeBox(4, 5, 4, col, -190, 39, -22);
        // St Nicholas Church inside fortress
        makeBox(18, 14, 12, 0xD8D0B8, -155, 46, -74);
        makeCyl(4, 4, 8, 8, 0xC8C0A8, -155, 57, -74);
        makeCone(4, 6, 8, 0x8B0000, -155, 64, -74);
        // Crumbling wall section (lower height)
        makeBox(20, 10, 5, col, -140, 24, -22);
        // Ruined tower stump
        makeCyl(5, 6, 14, 8, darkStone, -160, 21, -22);
    }

    // --- OLD TOWN (DZVELI TBILISI) ---
    function buildOldTown() {
        var houseCol = 0xCC8833;
        var woodCol = 0x8B5A2B;
        var sulfurCol = 0xC8B88A;
        // Row of balconied houses along river north bank
        makeBox(16, 18, 12, houseCol, -60, 15, -35);
        makeBox(4, 16, 12, woodCol, -60, 14, -35); // balcony overlay
        makeBox(16, 18, 12, houseCol, -40, 15, -35);
        makeBox(4, 16, 12, woodCol, -40, 14, -35);
        makeBox(16, 18, 12, houseCol, -20, 15, -35);
        makeBox(4, 16, 12, woodCol, -20, 14, -35);
        makeBox(16, 18, 12, houseCol, 0, 15, -35);
        makeBox(16, 22, 12, houseCol, 20, 17, -35);
        makeBox(4, 20, 12, woodCol, 20, 16, -35);
        makeBox(16, 18, 12, houseCol, 40, 15, -35);
        makeBox(4, 16, 12, woodCol, 40, 14, -35);
        // Second row slightly uphill
        makeBox(14, 16, 10, houseCol, -50, 20, -55);
        makeBox(14, 16, 10, 0xBB7722, -30, 20, -55);
        makeBox(14, 20, 10, houseCol, -10, 22, -55);
        makeBox(14, 16, 10, 0xCC9944, 10, 20, -55);
        makeBox(14, 16, 10, houseCol, 30, 20, -55);
        // Abanotubani sulfur bath domes
        makeCyl(10, 10, 8, sulfurCol, -90, 8, 10);
        makeSphere(10, 8, 6, sulfurCol, -90, 16, 10);
        makeCyl(8, 8, 8, sulfurCol, -70, 8, 20);
        makeSphere(8, 8, 6, sulfurCol, -70, 16, 20);
        makeCyl(9, 9, 8, sulfurCol, -110, 8, 5);
        makeSphere(9, 8, 6, sulfurCol, -110, 16, 5);
        // Narrow winding street markers (low cobblestone strips)
        makeBox(60, 1, 6, 0xB0A898, -30, 1, -28);
        makeBox(40, 1, 6, 0xB0A898, -70, 1, -20);
        makeBox(50, 1, 5, 0xB0A898, -20, 1, -45);
        // Old Town caravanserai / courtyard building
        makeBox(30, 14, 24, 0xBB9955, 60, 13, -55);
        makeBox(30, 2, 24, 0xA08840, 60, 21, -55); // roof overhang
        // Ornate church in old town
        makeBox(14, 18, 10, 0xD0B888, 80, 15, -40);
        makeCyl(4, 4, 6, 8, 0xC8B080, 80, 26, -40);
        makeCone(4, 5, 8, 0x6B3A1F, 80, 31, -40);
    }

    // --- METEKHI CHURCH ---
    function buildMetekhiChurch() {
        var col = 0xD4C0A0;
        // Cliff platform
        makeBox(50, 12, 40, 0x8B7A60, 100, 18, 20);
        // Main nave
        makeBox(22, 22, 16, col, 100, 29, 20);
        // Apse (east end)
        makeCyl(7, 7, 22, 8, col, 112, 29, 20);
        // Cylindrical drum below dome
        makeCyl(6, 6, 10, 12, 0xC8B898, 100, 42, 20);
        // Conical dome
        makeCone(7, 12, 12, 0xB8A888, 100, 53, 20);
        // Cross on top
        makeBox(1, 6, 1, 0xD0C0A0, 100, 61, 20);
        makeBox(4, 1, 1, 0xD0C0A0, 100, 63, 20);
        // Narthex (west entrance porch)
        makeBox(10, 16, 10, col, 88, 26, 20);
        makeCone(6, 6, 6, 0xB8A888, 88, 36, 20);
        // Retaining wall at cliff edge
        makeBox(50, 8, 4, 0x9A8870, 100, 16, 0);
        // Vakhtang Gorgasali equestrian statue
        makeCyl(2, 2, 8, 6, 0x707060, 88, 20, 8);  // horse body
        makeSphere(3, 6, 6, 0x707060, 88, 26, 8);    // rider torso
        makeCyl(1, 1, 10, 6, 0x807060, 84, 18, 8);   // horse front leg raised
        makeBox(1, 6, 1, 0x707060, 95, 24, 8);        // sword held up
        makeBox(3, 1, 1, 0x707060, 95, 27, 8);        // crossguard
        // Cliff face below church
        makeBox(50, 30, 10, 0x7A6A50, 100, 3, 14);
    }

    // --- MTATSMINDA FUNICULAR ---
    function buildMtatsmindaFunicular() {
        var trackCol = 0x555555;
        var carCol = 0xBB2222;
        var hillCol = 0x3A6B3A;
        // Forested hillside
        makeBox(40, 80, 30, hillCol, -220, 32, 60);
        // Track pillars
        makeBox(3, 20, 3, trackCol, -220, 22, 58);
        makeBox(3, 35, 3, trackCol, -220, 30, 58);
        makeBox(3, 50, 3, trackCol, -220, 37, 62);
        // Track rail lines (thin boxes at angle)
        makeBox(2, 90, 2, trackCol, -220, 37, 55);
        makeBox(2, 90, 2, trackCol, -220, 37, 61);
        // Lower funicular car
        makeBox(8, 6, 5, carCol, -220, 18, 58);
        makeBox(8, 1, 5, 0xCC4444, -220, 21, 58);
        // Upper funicular car
        makeBox(8, 6, 5, carCol, -220, 52, 60);
        makeBox(8, 1, 5, 0xCC4444, -220, 55, 60);
        // Amusement park platform at top
        makeBox(40, 4, 30, 0x888888, -220, 74, 60);
        makeBox(12, 18, 12, 0xDD4444, -220, 83, 60); // ferris wheel stand
        makeCyl(10, 10, 2, 12, 0xCC3333, -220, 91, 60); // ferris wheel ring
        // Forest trees (cone + cylinder)
        makeCyl(2, 2, 10, 6, 0x4A5A3A, -200, 40, 55);
        makeCone(5, 10, 6, 0x2A6B2A, -200, 47, 55);
        makeCyl(2, 2, 10, 6, 0x4A5A3A, -230, 45, 65);
        makeCone(5, 10, 6, 0x2A6B2A, -230, 52, 65);
        makeCyl(2, 2, 10, 6, 0x4A5A3A, -210, 30, 70);
        makeCone(5, 10, 6, 0x2A6B2A, -210, 37, 70);
    }

    // --- MOTHER OF GEORGIA (KARTLIS DEDA) ---
    function buildMotherOfGeorgia() {
        var col = 0xC8C8C0;
        var pedCol = 0xA09080;
        // Hilltop pedestal
        makeCyl(8, 10, 10, 8, pedCol, -185, 80, -60);
        makeBox(16, 4, 16, pedCol, -185, 87, -60);
        // Figure body (aluminium woman)
        makeCyl(3, 4, 20, 8, col, -185, 98, -60);
        // Head
        makeSphere(3, 8, 8, col, -185, 111, -60);
        // Sword arm (raised right)
        makeBox(2, 16, 2, col, -179, 105, -60);
        makeBox(1, 10, 1, 0xB8B8B0, -176, 113, -60);  // sword blade
        // Wine bowl arm (extended left)
        makeBox(12, 2, 2, col, -191, 100, -60);
        makeCyl(3, 3, 3, 8, 0xA09080, -196, 100, -60); // bowl
        // Crown / headdress
        makeCone(3, 5, 8, col, -185, 115, -60);
        // Hill platform below statue
        makeBox(60, 6, 50, 0x7A6A55, -185, 74, -60);
    }

    // --- PEACE BRIDGE ---
    function buildPeaceBridge() {
        var steelCol = 0x4488BB;
        var glassCol = 0x88BBDD;
        // Main span deck
        makeBox(120, 3, 16, steelCol, 0, -4, 0);
        // S-curve canopy arch north side
        makeBox(4, 22, 120, glassCol, -10, 8, 0);
        // S-curve canopy arch south side
        makeBox(4, 22, 120, glassCol, 10, 8, 0);
        // Canopy top glass panels
        makeBox(20, 4, 120, glassCol, 0, 19, 0);
        // Support pylons
        makeCyl(2, 2, 26, 8, steelCol, -20, 9, 0);
        makeCyl(2, 2, 26, 8, steelCol, 20, 9, 0);
        makeCyl(2, 2, 26, 8, steelCol, -40, 9, 0);
        makeCyl(2, 2, 26, 8, steelCol, 40, 9, 0);
        // LED light strip indicators (thin accent boxes)
        makeBox(120, 1, 1, 0xAADDFF, 0, 21, -7);
        makeBox(120, 1, 1, 0xAADDFF, 0, 21, 7);
        // Bridge approach ramps
        makeBox(30, 3, 16, 0xC0B8B0, -75, -5, 0);
        makeBox(30, 3, 16, 0xC0B8B0, 75, -5, 0);
    }

    // --- GEORGIAN NATIONAL MUSEUM ---
    function buildGeorgianNationalMuseum() {
        var col = 0xD4C8B0;
        var colCol = 0xE0D8C0;
        // Main building body
        makeBox(60, 24, 30, col, 160, 18, -80);
        // Classical portico columns (front)
        makeCyl(2, 2, 22, 8, colCol, 138, 17, -68);
        makeCyl(2, 2, 22, 8, colCol, 146, 17, -68);
        makeCyl(2, 2, 22, 8, colCol, 154, 17, -68);
        makeCyl(2, 2, 22, 8, colCol, 162, 17, -68);
        makeCyl(2, 2, 22, 8, colCol, 170, 17, -68);
        makeCyl(2, 2, 22, 8, colCol, 178, 17, -68);
        // Pediment (triangular gable)
        makeBox(60, 10, 6, col, 160, 32, -68);
        makeCone(30, 10, 4, col, 160, 36, -68);
        // Steps leading up
        makeBox(60, 2, 8, 0xC8C0A8, 160, 7, -63);
        makeBox(60, 2, 6, 0xC8C0A8, 160, 5, -57);
        // Side wings
        makeBox(16, 18, 30, col, 122, 15, -80);
        makeBox(16, 18, 30, col, 198, 15, -80);
        // Roof balustrade
        makeBox(60, 3, 2, col, 160, 31, -95);
    }

    // --- HOLY TRINITY CATHEDRAL (SAMEBA) ---
    function buildHolyTrinityCathedral() {
        var col = 0xD4C8A0;
        var goldCol = 0xD4AA00;
        var stoneCol = 0xC0B090;
        // Main cathedral base / podium
        makeBox(80, 10, 70, stoneCol, 240, 11, -80);
        // Main nave body
        makeBox(44, 40, 36, col, 240, 34, -80);
        // Transept (cross arms)
        makeBox(70, 32, 20, col, 240, 30, -80);
        // Main drum below golden dome
        makeCyl(10, 10, 20, 12, col, 240, 56, -80);
        // Golden dome (main, 84m equivalent)
        makeSphere(11, 12, 8, goldCol, 240, 68, -80);
        makeCone(4, 8, 8, goldCol, 240, 75, -80);
        makeBox(1, 8, 1, goldCol, 240, 81, -80); // cross
        makeBox(5, 1, 1, goldCol, 240, 84, -80);
        // Four smaller corner chapels
        makeCyl(5, 5, 16, 8, col, 218, 24, -62);
        makeSphere(5, 8, 6, goldCol, 218, 32, -62);
        makeCone(2, 5, 8, goldCol, 218, 36, -62);
        makeCyl(5, 5, 16, 8, col, 262, 24, -62);
        makeSphere(5, 8, 6, goldCol, 262, 32, -62);
        makeCone(2, 5, 8, goldCol, 262, 36, -62);
        makeCyl(5, 5, 16, 8, col, 218, 24, -98);
        makeSphere(5, 8, 6, goldCol, 218, 32, -98);
        makeCone(2, 5, 8, goldCol, 218, 36, -98);
        makeCyl(5, 5, 16, 8, col, 262, 24, -98);
        makeSphere(5, 8, 6, goldCol, 262, 32, -98);
        makeCone(2, 5, 8, goldCol, 262, 36, -98);
        // Bell tower
        makeBox(16, 50, 16, col, 222, 37, -80);
        makeCyl(6, 6, 6, 8, col, 222, 63, -80);
        makeCone(6, 8, 8, goldCol, 222, 68, -80);
        // Grand staircase approach
        makeBox(50, 3, 12, stoneCol, 240, 8, -46);
        makeBox(50, 2, 8, stoneCol, 240, 6, -38);
        // Surrounding compound wall
        makeBox(100, 6, 4, stoneCol, 240, 8, -116);
        makeBox(4, 6, 80, stoneCol, 192, 8, -80);
        makeBox(4, 6, 80, stoneCol, 288, 8, -80);
    }

    // --- RUSTAVELI AVENUE ---
    function buildRustaveliAvenue() {
        var aveCol = 0xD0C8B8;
        var buildCol = 0xC8B890;
        // Main boulevard surface
        makeBox(300, 2, 30, aveCol, 100, 1, 80);
        // Median / tree-lined center strip
        makeBox(300, 2, 8, 0x5A7A4A, 100, 2, 80);
        // Opera House
        makeBox(40, 28, 30, buildCol, -30, 20, 80);
        makeCyl(14, 14, 6, buildCol, -30, 34, 80);
        makeSphere(14, 8, 6, buildCol, -30, 38, 80);
        // Opera House columns
        makeCyl(2, 2, 26, 8, 0xD8D0C0, -46, 19, 68);
        makeCyl(2, 2, 26, 8, 0xD8D0C0, -38, 19, 68);
        makeCyl(2, 2, 26, 8, 0xD8D0C0, -22, 19, 68);
        makeCyl(2, 2, 26, 8, 0xD8D0C0, -14, 19, 68);
        // Parliament building
        makeBox(50, 22, 28, buildCol, 60, 17, 80);
        makeCyl(8, 8, 10, 8, buildCol, 60, 26, 80);
        makeSphere(8, 8, 6, 0xC0B888, 60, 31, 80);
        // Parliament columns
        makeCyl(2, 2, 20, 8, 0xD8D0C0, 40, 16, 68);
        makeCyl(2, 2, 20, 8, 0xD8D0C0, 48, 16, 68);
        makeCyl(2, 2, 20, 8, 0xD8D0C0, 56, 16, 68);
        makeCyl(2, 2, 20, 8, 0xD8D0C0, 64, 16, 68);
        makeCyl(2, 2, 20, 8, 0xD8D0C0, 72, 16, 68);
        makeCyl(2, 2, 20, 8, 0xD8D0C0, 80, 16, 68);
        // National Gallery
        makeBox(36, 18, 22, buildCol, 140, 15, 80);
        makeBox(36, 5, 4, 0xC8C0A0, 140, 24, 69);
        // Rustaveli monument
        makeCyl(3, 4, 14, 8, 0x888070, 100, 13, 68);
        makeSphere(4, 8, 8, 0x907860, 100, 21, 68);
        // Avenue lamp posts
        makeBox(1, 14, 1, 0x444444, 20, 9, 68);
        makeSphere(2, 6, 6, 0xFFEE88, 20, 17, 68);
        makeBox(1, 14, 1, 0x444444, 60, 9, 68);
        makeSphere(2, 6, 6, 0xFFEE88, 60, 17, 68);
        makeBox(1, 14, 1, 0x444444, 100, 9, 68);
        makeSphere(2, 6, 6, 0xFFEE88, 100, 17, 68);
        makeBox(1, 14, 1, 0x444444, 140, 9, 68);
        makeSphere(2, 6, 6, 0xFFEE88, 140, 17, 68);
        makeBox(1, 14, 1, 0x444444, 180, 9, 68);
        makeSphere(2, 6, 6, 0xFFEE88, 180, 17, 68);
    }

    // --- HILL TERRAIN BASE ---
    function buildHillTerrain() {
        // Sololaki hill base (Narikala sits on this)
        makeBox(180, 20, 100, 0x7A6A52, -160, 8, -60);
        // Metekhi cliff base
        makeBox(60, 22, 30, 0x7A6A52, 100, 7, 20);
        // Mtatsminda hill mass
        makeBox(80, 60, 60, 0x4A6040, -220, 18, 60);
        // Kartsli hill for Mother of Georgia
        makeBox(50, 60, 50, 0x6A5A42, -185, 42, -60);
        // Sameba hill / plateau
        makeBox(120, 8, 100, 0x8A7A60, 240, 6, -80);
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
