window.AmmanCitadel = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 24120;
    var CY = 0;
    var CZ = 0;

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
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildCitadel();
        buildRomanTheatre();
        buildKingAbdullahMosque();
        buildRaghadanFlagpole();
        buildRainbowStreet();
        buildJordanMuseum();
        buildFourthCircle();
        buildDeadSea();
        buildWadiSaqra();
        buildUniversityOfJordan();
    }

    function buildGround() {
        // Main city ground plateau - use box as plane substitute
        makebox(1600, 2, 1600, 0xC8B89A, 0, -1, 0);
        // Citadel hill
        makebox(300, 60, 300, 0xB8A882, -200, 30, -100);
        // Theatre hillside
        makebox(200, 40, 200, 0xBBAA88, 300, 20, 200);
    }

    function buildCitadel() {
        // --- Citadel base platform on hilltop ---
        makebox(280, 8, 280, 0xD4A870, -200, 64, -100);

        // Outer citadel wall north
        makebox(280, 16, 6, 0xC8986A, -200, 76, -237);
        // Outer citadel wall south
        makebox(280, 16, 6, 0xC8986A, -200, 76, -37);
        // Outer citadel wall east
        makebox(6, 16, 200, 0xC8986A, -60, 76, -137);
        // Outer citadel wall west
        makebox(6, 16, 200, 0xC8986A, -340, 76, -137);

        // Wall towers at corners
        makebox(18, 22, 18, 0xBB8860, -340, 79, -237);
        makebox(18, 22, 18, 0xBB8860, -60, 79, -237);
        makebox(18, 22, 18, 0xBB8860, -340, 79, -37);
        makebox(18, 22, 18, 0xBB8860, -60, 79, -37);

        // Temple of Hercules - podium base
        makebox(80, 6, 50, 0xD8B880, -200, 71, -190);
        // Temple steps
        makebox(90, 3, 6, 0xCCAA70, -200, 69, -168);
        makebox(86, 3, 6, 0xCCAA70, -200, 67, -164);

        // Temple of Hercules - 4 Corinthian columns standing
        makecyl(2.2, 2.2, 28, 8, 0xD8C898, -168, 85, -190);
        makecyl(2.2, 2.2, 28, 8, 0xD8C898, -183, 85, -190);
        makecyl(2.2, 2.2, 28, 8, 0xD8C898, -217, 85, -190);
        makecyl(2.2, 2.2, 28, 8, 0xD8C898, -232, 85, -190);
        // Column capitals (tops)
        makebox(6, 4, 6, 0xDDD0A0, -168, 100, -190);
        makebox(6, 4, 6, 0xDDD0A0, -183, 100, -190);
        makebox(6, 4, 6, 0xDDD0A0, -217, 100, -190);
        makebox(6, 4, 6, 0xDDD0A0, -232, 100, -190);
        // Partial entablature connecting two middle columns
        makebox(36, 5, 5, 0xD0BC88, -200, 103, -190);

        // Byzantine Church ruins - partial walls
        makebox(60, 12, 5, 0xC89060, -200, 75, -130);
        makebox(5, 12, 50, 0xC89060, -172, 75, -107);
        makebox(5, 12, 50, 0xC89060, -228, 75, -107);
        makebox(40, 8, 5, 0xC89060, -200, 72, -85);
        // Church apse ruin - half cylinder shape using box segments
        makebox(20, 10, 20, 0xBB8858, -200, 74, -78);
        // Fallen column drum
        makecyl(3, 3, 7, 8, 0xD8C898, -195, 68, -100);

        // Umayyad Palace complex
        // Main palace structure
        makebox(90, 14, 80, 0xD4A870, -160, 72, -50);
        // Palace courtyard
        makebox(60, 2, 55, 0xC8B888, -160, 66, -50);
        // Domed audience hall
        makbox_dome(-160, 73, -50);
        // Palace entrance iwan
        makebox(24, 18, 8, 0xCC9C66, -160, 73, -12);
        // Iwan arch cutout illusion - dark interior box
        makebox(14, 12, 6, 0x443322, -160, 73, -11);
        // Palace side wings
        makebox(20, 10, 80, 0xD0A06A, -116, 70, -50);
        makebox(20, 10, 80, 0xD0A06A, -204, 70, -50);
    }

    function makbox_dome(x, y, z) {
        // Dome using sphere half
        var geo = new THREE.SphereGeometry(18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        var mat = new THREE.MeshLambertMaterial({ color: 0xD4A870 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y + 14, CZ + z);
        return addMesh(mesh);
    }

    function buildRomanTheatre() {
        // Theatre is carved into hillside to east
        // Hillside backing
        makebox(200, 50, 100, 0xC8B890, 300, 25, 200);

        // Scaena (stage building) - back wall
        makebox(140, 30, 12, 0xD4C8A0, 300, 83, 160);
        // Scaena upper story
        makebox(140, 16, 10, 0xCCC0A0, 300, 101, 160);
        // Scaena decorative columns front row
        makecyl(1.8, 1.8, 28, 8, 0xDDD0B0, 260, 97, 166);
        makecyl(1.8, 1.8, 28, 8, 0xDDD0B0, 280, 97, 166);
        makecyl(1.8, 1.8, 28, 8, 0xDDD0B0, 300, 97, 166);
        makecyl(1.8, 1.8, 28, 8, 0xDDD0B0, 320, 97, 166);
        makecyl(1.8, 1.8, 28, 8, 0xDDD0B0, 340, 97, 166);

        // Orchestra (stage floor)
        makebox(100, 4, 30, 0xD8CC9A, 300, 70, 182);

        // Pulpitum (stage front)
        makebox(110, 8, 8, 0xCCBE90, 300, 72, 196);

        // Cavea - semicircular seating tiers (box approximations)
        // Ima cavea (lower seating)
        makebox(130, 6, 28, 0xD4C8A0, 300, 76, 212);
        makebox(4, 6, 28, 0xBBAA80, 237, 76, 212);
        makebox(4, 6, 28, 0xBBAA80, 363, 76, 212);
        // Media cavea (middle seating)
        makebox(160, 6, 28, 0xCEC2A0, 300, 82, 236);
        makebox(4, 6, 28, 0xBBAA80, 222, 82, 236);
        makebox(4, 6, 28, 0xBBAA80, 378, 82, 236);
        // Summa cavea (upper seating)
        makebox(180, 6, 28, 0xC8BC9C, 300, 88, 260);
        makebox(4, 6, 28, 0xBBAA80, 212, 88, 260);
        makebox(4, 6, 28, 0xBBAA80, 388, 88, 260);
        // Top retaining wall
        makebox(200, 10, 8, 0xBBAA80, 300, 94, 278);

        // Columned portico at cavea top
        makecyl(2, 2, 12, 8, 0xDDD0B0, 240, 100, 280);
        makecyl(2, 2, 12, 8, 0xDDD0B0, 265, 100, 280);
        makecyl(2, 2, 12, 8, 0xDDD0B0, 290, 100, 280);
        makecyl(2, 2, 12, 8, 0xDDD0B0, 315, 100, 280);
        makecyl(2, 2, 12, 8, 0xDDD0B0, 340, 100, 280);
        makecyl(2, 2, 12, 8, 0xDDD0B0, 365, 100, 280);
        // Portico entablature
        makebox(140, 4, 4, 0xCCC0A0, 302, 106, 280);

        // Side walls (analemma)
        makebox(10, 40, 120, 0xBBAA88, 232, 88, 232);
        makebox(10, 40, 120, 0xBBAA88, 368, 88, 232);

        // Small shrines at theatre entrance
        makebox(16, 16, 12, 0xD4C8A0, 248, 70, 296);
        makebox(16, 16, 12, 0xD4C8A0, 352, 70, 296);
    }

    function buildKingAbdullahMosque() {
        // Located west-southwest of centre
        // Mosque main hall base
        makebox(100, 10, 100, 0x2244AA, -400, 5, 200);
        // Raised prayer hall platform
        makebox(80, 4, 80, 0x3355BB, -400, 10, 200);

        // Main prayer hall walls
        makebox(70, 20, 70, 0x3355BB, -400, 20, 200);
        // Octagonal drum for dome
        makebox(50, 8, 50, 0x3366CC, -400, 31, 200);
        makbox_bluedome(-400, 34, 200);

        // Main entrance iwan portal
        makebox(28, 22, 6, 0x2244AA, -400, 16, 166);
        makebox(18, 16, 4, 0x112233, -400, 16, 165);
        // Entrance steps
        makebox(32, 2, 8, 0x3355BB, -400, 5, 162);
        makebox(28, 2, 8, 0x3355BB, -400, 3, 158);

        // Two minarets
        makecyl(3.5, 3.5, 80, 8, 0x2244AA, -440, 40, 168);
        makecyl(4.5, 3.5, 4, 8, 0x2244AA, -440, 82, 168);
        makecone(4, 10, 8, 0x2244AA, -440, 90, 168);

        makecyl(3.5, 3.5, 80, 8, 0x2244AA, -360, 40, 168);
        makecyl(4.5, 3.5, 4, 8, 0x2244AA, -360, 82, 168);
        makecone(4, 10, 8, 0x2244AA, -360, 90, 168);

        // Mosque courtyard (sahn)
        makebox(80, 2, 40, 0x4466AA, -400, 1, 235);
        // Ablution fountain in courtyard
        makecyl(8, 8, 3, 12, 0x334488, -400, 2, 245);
        makecyl(3, 3, 6, 12, 0x334488, -400, 4, 245);
        // Courtyard arcade columns
        makecyl(1.5, 1.5, 12, 8, 0x2244AA, -365, 6, 225);
        makecyl(1.5, 1.5, 12, 8, 0x2244AA, -380, 6, 225);
        makecyl(1.5, 1.5, 12, 8, 0x2244AA, -420, 6, 225);
        makecyl(1.5, 1.5, 12, 8, 0x2244AA, -435, 6, 225);

        // Royal mosque perimeter fence/wall
        makebox(140, 5, 3, 0x3355BB, -400, 2, 160);
        makebox(3, 5, 100, 0x3355BB, -473, 2, 210);
        makebox(3, 5, 100, 0x3355BB, -327, 2, 210);
        makebox(140, 5, 3, 0x3355BB, -400, 2, 260);
    }

    function makbox_bluedome(x, y, z) {
        var geo = new THREE.SphereGeometry(28, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        var mat = new THREE.MeshLambertMaterial({ color: 0x4499DD });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y + 28, CZ + z);
        return addMesh(mesh);
    }

    function buildRaghadanFlagpole() {
        // Near citadel, tall steel pole
        // Base pedestal
        makebox(20, 8, 20, 0xAAAAAA, -80, 4, -20);
        makebox(14, 4, 14, 0xBBBBBB, -80, 10, -20);
        // Main pole — 126m represented at scale
        makecyl(1.2, 1.2, 126, 8, 0xCCCCCC, -80, 70, -20);
        // Flag (Jordanian colors: black, white, green horizontal stripes + red triangle)
        makebox(28, 9, 1, 0x111111, -66, 126, -20);
        makebox(28, 9, 1, 0xEEEEEE, -66, 117, -20);
        makebox(28, 9, 1, 0x006600, -66, 108, -20);
        // Red triangle
        makebox(9, 27, 1, 0xCC0000, -79, 117, -20);
    }

    function buildRainbowStreet() {
        // Trendy hillside street - west area
        // Main street surface
        makebox(200, 3, 18, 0xCC8833, 100, 2, -300);

        // Art Deco building row - south side of street
        makebox(22, 28, 18, 0xD4B878, 40, 15, -312);
        makebox(18, 22, 18, 0xCCB070, 68, 12, -312);
        makebox(24, 32, 18, 0xD8C08A, 96, 17, -312);
        makebox(20, 24, 18, 0xC8AA68, 122, 13, -312);
        makebox(26, 30, 18, 0xD4B880, 154, 16, -312);
        makebox(18, 20, 18, 0xCCB070, 180, 11, -312);

        // North side boutiques and cafes
        makebox(20, 18, 16, 0xC8AA68, 50, 10, -288);
        makebox(22, 22, 16, 0xD0B874, 78, 12, -288);
        makebox(18, 16, 16, 0xCCAA66, 106, 9, -288);
        makebox(24, 20, 16, 0xD4BC7C, 136, 11, -288);
        makebox(20, 24, 16, 0xCCB070, 162, 13, -288);

        // Street lamps
        makecyl(0.5, 0.5, 8, 6, 0x888888, 60, 5, -300);
        makecyl(0.5, 0.5, 8, 6, 0x888888, 100, 5, -300);
        makecyl(0.5, 0.5, 8, 6, 0x888888, 140, 5, -300);
        makecyl(0.5, 0.5, 8, 6, 0x888888, 180, 5, -300);

        // Sidewalk terracing
        makebox(200, 2, 6, 0xBBAA88, 100, 1, -305);
        makebox(200, 2, 6, 0xBBAA88, 100, 1, -295);
    }

    function buildJordanMuseum() {
        // Modern museum - south of centre
        // Main building block - contemporary architecture
        makebox(90, 20, 60, 0xD4C8B0, 60, 10, 100);
        // Upper recessed floor
        makebox(70, 12, 50, 0xCCC0A8, 60, 26, 100);
        // Glass atrium approximation (lighter color box)
        makebox(30, 18, 20, 0xE0D8C8, 60, 24, 100);
        // Entrance canopy
        makebox(40, 4, 16, 0xD4C8B0, 60, 22, 72);
        makecyl(1.5, 1.5, 22, 6, 0xC8BC9C, 44, 11, 72);
        makecyl(1.5, 1.5, 22, 6, 0xC8BC9C, 76, 11, 72);

        // Museum plaza
        makebox(110, 2, 80, 0xBEBAA8, 60, 1, 100);

        // Dead Sea Scrolls wing - circular exhibition hall
        makecyl(18, 18, 14, 16, 0xCCC4B0, 108, 7, 104);
        makbox_cylindertop(108, 14, 104);

        // Outdoor artifact display plinths
        makebox(4, 4, 4, 0xD0C8A8, 20, 3, 80);
        makebox(4, 4, 4, 0xD0C8A8, 30, 3, 80);
        makebox(4, 4, 4, 0xD0C8A8, 40, 3, 80);
    }

    function makbox_cylindertop(x, y, z) {
        var geo = new THREE.SphereGeometry(18, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        var mat = new THREE.MeshLambertMaterial({ color: 0xCCC4B0 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y + 4, CZ + z);
        return addMesh(mesh);
    }

    function buildFourthCircle() {
        // Upscale embassy district - northwest quadrant
        // Embassy row buildings
        makebox(30, 22, 24, 0xD4D0C8, -300, 12, -350);
        makebox(28, 18, 22, 0xD0CCC4, -340, 10, -350);
        makebox(32, 26, 24, 0xDDD8CC, -268, 14, -350);
        makebox(26, 20, 22, 0xD4D0C8, -380, 11, -350);
        makebox(30, 24, 24, 0xD8D4C8, -236, 13, -350);

        // Luxury hotels
        makebox(50, 44, 30, 0xD8D4CC, -160, 23, -360);
        makebox(44, 36, 28, 0xD4D0C8, -220, 19, -360);

        // Traffic circle roundabout
        makecyl(22, 22, 2, 16, 0xBBB8B0, -300, 1, -420);
        makecyl(12, 12, 3, 16, 0xCCC8C0, -300, 2, -420);
        // Roundabout center feature
        makebox(4, 10, 4, 0xDDD8CC, -300, 6, -420);

        // Road grid suggestion
        makebox(300, 2, 12, 0x888880, -300, 1, -390);
        makebox(12, 2, 200, 0x888880, -300, 1, -380);

        // Restaurant and cafe strip
        makebox(18, 14, 14, 0xD8D4C8, -250, 8, -310);
        makebox(16, 12, 14, 0xD4D0C4, -272, 7, -310);
        makebox(20, 16, 14, 0xDDD8CC, -226, 9, -310);
    }

    function buildDeadSea() {
        // Visible on western horizon - distant body of water
        // Represent as a flat box far to the west at low elevation
        makebox(600, 2, 200, 0x4488AA, -900, -40, 0);
        // Sea surface shimmer hint - slightly lighter box overlay
        makebox(580, 1, 180, 0x55AACC, -900, -39, 0);
        // Western hills/cliffs before Dead Sea
        makebox(120, 80, 200, 0x9A8870, -760, 40, 0);
        makebox(100, 60, 200, 0x9A9080, -820, 30, 0);
    }

    function buildWadiSaqra() {
        // Valley cutting through city - represented as depressed terrain cuts
        // Wadi channel - lower box representing valley floor
        makebox(500, 20, 60, 0x888888, 50, -8, 0);
        // Valley walls
        makebox(500, 30, 14, 0x9A9090, 50, 8, -28);
        makebox(500, 30, 14, 0x9A9090, 50, 8, 28);
        // Wadi bridge crossing
        makebox(14, 4, 80, 0xAAAAAA, 80, 6, 0);
        makbox_bridge_support(80, -6, -20);
        makbox_bridge_support(80, -6, 20);
    }

    function makbox_bridge_support(x, y, z) {
        makebox(4, 14, 4, 0x999999, x, y, z);
    }

    function buildUniversityOfJordan() {
        // Large campus north of centre
        // Main admin building
        makebox(80, 28, 50, 0xD4C8A0, 200, 15, -500);
        // Science faculty
        makebox(60, 22, 45, 0xCCC0A0, 140, 12, -470);
        // Arts faculty
        makebox(55, 20, 45, 0xD0C4A0, 270, 11, -470);
        // Library - larger taller building
        makebox(70, 36, 55, 0xD4CCA8, 200, 19, -555);
        // University mosque
        makecyl(10, 10, 16, 12, 0xD4C8A0, 150, 9, -540);
        makbox_unimosquedome(150, 18, -540);
        makecyl(2, 2, 30, 8, 0xCCBE98, 135, 16, -540);

        // Campus gardens - series of low green-tinted boxes
        makebox(40, 2, 30, 0x6A9A60, 200, 1, -440);
        makebox(30, 2, 30, 0x6A9A60, 155, 1, -440);
        makebox(30, 2, 30, 0x6A9A60, 248, 1, -440);

        // Amphitheatre on campus
        makebox(50, 6, 40, 0xCCC0A0, 240, 4, -530);
        makebox(60, 4, 40, 0xCCBE9E, 240, 8, -544);
        makebox(70, 4, 40, 0xCCBC9C, 240, 12, -558);

        // Student housing blocks
        makebox(30, 32, 20, 0xD8D0B0, 320, 17, -510);
        makebox(30, 32, 20, 0xD8D0B0, 320, 17, -545);
        makebox(30, 32, 20, 0xD8D0B0, 320, 17, -480);

        // Campus road
        makebox(300, 2, 10, 0x9A9488, 200, 1, -460);
        makebox(10, 2, 200, 0x9A9488, 200, 1, -510);
    }

    function makbox_unimosquedome(x, y, z) {
        var geo = new THREE.SphereGeometry(10, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        var mat = new THREE.MeshLambertMaterial({ color: 0xD4C8A0 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y + 10, CZ + z);
        return addMesh(mesh);
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
