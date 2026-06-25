window.KelsoAbbey = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 20320;
    var OY = 0;
    var OZ = 0;

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        return makeMesh(geo, color, x, y, z);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        return makeMesh(geo, color, x, y, z);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        return makeMesh(geo, color, x, y, z);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        return makeMesh(geo, color, x, y, z);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function build() {
        buildGround();
        buildKelsoAbbey();
        buildRiverTweed();
        buildRiverTeviot();
        buildKelsoBridge();
        buildMarketSquare();
        buildTownHall();
        buildFloorscastle();
        buildKelsoRacecourse();
        buildRoxburghCastle();
        buildEdnamVillage();
        buildTownBuildings();
        buildVegetation();
    }

    function buildGround() {
        // Ground plane using boxes to avoid PlaneGeometry
        makeBox(800, 1, 800, 0x7A9E5A, 0, -0.5, 0);
        // Road surfaces
        makeBox(20, 1, 300, 0x555555, 0, -0.4, 0);
        makeBox(300, 1, 20, 0x555555, 0, -0.4, 0);
        // Dirt path to abbey
        makeBox(10, 1, 120, 0x9B7A5A, -40, -0.4, -80);
    }

    function buildKelsoAbbey() {
        var sandstone = 0xCD5C5C;
        var darkstone = 0xAA4040;
        var interior = 0xB54A4A;

        // Main nave floor base
        makeBox(30, 3, 60, sandstone, -40, 1.5, -120);

        // West facade - main wall
        makeBox(30, 28, 4, sandstone, -40, 14, -150);

        // West facade - twin towers flanking west front
        // North-west tower (largely intact Romanesque)
        makeBox(10, 40, 10, sandstone, -50, 20, -150);
        // Tower parapet
        makeBox(10, 3, 10, darkstone, -50, 41.5, -150);
        // Tower battlements
        makeBox(3, 4, 2, darkstone, -47, 43, -150);
        makeBox(3, 4, 2, darkstone, -51, 43, -150);
        makeBox(2, 4, 3, darkstone, -50, 43, -147);
        makeBox(2, 4, 3, darkstone, -50, 43, -153);

        // South-west tower
        makeBox(10, 32, 10, sandstone, -30, 16, -150);
        makeBox(10, 3, 10, darkstone, -30, 33.5, -150);
        makeBox(3, 4, 2, darkstone, -27, 35.5, -150);
        makeBox(3, 4, 2, darkstone, -33, 35.5, -150);

        // West facade Romanesque arcading - decorative blind arches
        makeCyl(2, 2, 12, 8, darkstone, -35, 10, -152);
        makeCyl(2, 2, 12, 8, darkstone, -40, 10, -152);
        makeCyl(2, 2, 12, 8, darkstone, -45, 10, -152);
        // Arch spandrels
        makeBox(4, 2, 1, darkstone, -37.5, 16, -152);
        makeBox(4, 2, 1, darkstone, -42.5, 16, -152);

        // Round-headed main west doorway
        makeBox(6, 10, 2, 0x332222, -40, 5, -152);
        makeCyl(3, 3, 2, 8, darkstone, -40, 10, -152);

        // North aisle wall
        makeBox(4, 18, 60, sandstone, -57, 9, -120);
        // South aisle wall
        makeBox(4, 18, 60, sandstone, -23, 9, -120);

        // Clerestory walls (nave upper section)
        makeBox(4, 12, 60, darkstone, -56, 24, -120);
        makeBox(4, 12, 60, darkstone, -24, 24, -120);

        // Transept - north arm
        makeBox(28, 28, 20, sandstone, -40, 14, -160);
        // Transept north end gable
        makeBox(28, 8, 4, darkstone, -40, 30, -170);

        // Transept - south arm
        makeBox(28, 24, 20, sandstone, -40, 12, -80);
        // Transept south end gable (partial ruin)
        makeBox(14, 6, 4, darkstone, -34, 24, -70);
        makeBox(10, 10, 4, darkstone, -46, 20, -70);

        // Crossing tower - central tower
        makeBox(16, 36, 16, sandstone, -40, 18, -140);
        // Crossing tower upper stage
        makeBox(14, 12, 14, darkstone, -40, 42, -140);
        // Crossing tower parapet
        makeBox(14, 2, 14, 0x993333, -40, 48, -140);
        // Crossing tower battlements
        makeBox(4, 4, 2, darkstone, -36, 50, -140);
        makeBox(4, 4, 2, darkstone, -44, 50, -140);
        makeBox(2, 4, 4, darkstone, -40, 50, -136);
        makeBox(2, 4, 4, darkstone, -40, 50, -144);

        // Choir/presbytery east end
        makeBox(24, 22, 30, sandstone, -40, 11, -195);
        // East window recess
        makeBox(10, 14, 3, 0x221111, -40, 11, -210);

        // Ruined choir north wall (partial)
        makeBox(4, 14, 30, sandstone, -53, 7, -195);
        // Ruined south wall fragment
        makeBox(4, 8, 15, sandstone, -27, 4, -190);

        // Romanesque pillars in nave
        makeCyl(1.5, 1.5, 18, 8, darkstone, -46, 9, -105);
        makeCyl(1.5, 1.5, 18, 8, darkstone, -34, 9, -105);
        makeCyl(1.5, 1.5, 18, 8, darkstone, -46, 9, -120);
        makeCyl(1.5, 1.5, 18, 8, darkstone, -34, 9, -120);
        makeCyl(1.5, 1.5, 18, 8, darkstone, -46, 9, -135);
        makeCyl(1.5, 1.5, 18, 8, darkstone, -34, 9, -135);

        // Grassy abbey grounds / ruins mound
        makeBox(80, 2, 120, 0x5A8A3A, -40, 0, -130);
    }

    function buildRiverTweed() {
        var water = 0x006994;
        // River Tweed — wide winding river south of town
        makeBox(80, 1, 400, water, 60, -1, 50);
        makeBox(100, 1, 60, water, 80, -1, -20);
        makeBox(90, 1, 80, water, 70, -1, 120);
        // Riverbanks
        makeBox(8, 2, 400, 0x8B7355, 18, 0, 50);
        makeBox(8, 2, 400, 0x8B7355, 102, 0, 50);
        // Gravel banks
        makeBox(6, 1, 60, 0xC2B280, 22, 0, 0);
        makeBox(6, 1, 40, 0xC2B280, 100, 0, 80);
    }

    function buildRiverTeviot() {
        var water = 0x006994;
        // River Teviot — joins Tweed from west (salmon confluence)
        makeBox(400, 1, 50, water, -120, -1, 80);
        makeBox(50, 1, 120, water, -20, -1, 20);
        // Confluence area — slightly wider pool
        makeBox(100, 1, 80, water, 30, -1, 60);
        // Teviot banks
        makeBox(400, 2, 6, 0x8B7355, -120, 0, 53);
        makeBox(400, 2, 6, 0x8B7355, -120, 0, 107);
    }

    function buildKelsoBridge() {
        var stone = 0xC8B89A;
        var arch = 0xB8A88A;
        // Five-arch Georgian bridge over Tweed
        // Bridge deck
        makeBox(20, 3, 120, stone, 20, 2, 20);
        // Piers (5 arches = 4 intermediate piers + 2 abutments)
        makeBox(4, 8, 10, stone, 20, -1, -15);
        makeBox(4, 8, 10, stone, 20, -1, 0);
        makeBox(4, 8, 10, stone, 20, -1, 15);
        makeBox(4, 8, 10, stone, 20, -1, 30);
        // Arch voids under each span
        makeCyl(5, 5, 10, 8, arch, 20, -2, -22);
        makeCyl(5, 5, 10, 8, arch, 20, -2, -7);
        makeCyl(5, 5, 10, 8, arch, 20, -2, 8);
        makeCyl(5, 5, 10, 8, arch, 20, -2, 23);
        makeCyl(5, 5, 10, 8, arch, 20, -2, 38);
        // Parapet walls
        makeBox(2, 3, 120, stone, 9, 4, 20);
        makeBox(2, 3, 120, stone, 31, 4, 20);
        // Bridge end abutments
        makeBox(20, 6, 6, stone, 20, 1, -20);
        makeBox(20, 6, 6, stone, 20, 1, 60);
    }

    function buildMarketSquare() {
        var cobble = 0xF5F0E8;
        var edging = 0xDDCCBB;
        // Kelso Market Square — large Georgian cobbled square
        makeBox(120, 1, 100, cobble, 0, 0, -30);
        // Square border kerbing
        makeBox(120, 2, 4, edging, 0, 1, 20);
        makeBox(120, 2, 4, edging, 0, 1, -80);
        makeBox(4, 2, 100, edging, 62, 1, -30);
        makeBox(4, 2, 100, edging, -62, 1, -30);
        // Central market cross / monument
        makeCyl(1, 1.5, 8, 6, 0xBBAA99, 0, 4, -30);
        makeSphere(2, 8, 8, 0xBBAA99, 0, 8.5, -30);
        // Market booths / stalls (period market buildings)
        makeBox(15, 8, 8, 0xDDD0B8, 40, 4, -30);
        makeBox(15, 8, 8, 0xDDD0B8, -40, 4, -30);
        makeBox(15, 8, 8, 0xDDD0B8, 0, 4, -70);
        // Square lamp posts
        makeCyl(0.3, 0.3, 8, 6, 0x333333, 50, 4, -10);
        makeCyl(0.3, 0.3, 8, 6, 0x333333, -50, 4, -10);
        makeCyl(0.3, 0.3, 8, 6, 0x333333, 50, 4, -50);
        makeCyl(0.3, 0.3, 8, 6, 0x333333, -50, 4, -50);
    }

    function buildTownHall() {
        var facade = 0xD4C9B0;
        var roof = 0x8899AA;
        // Neoclassical town hall — Kelso Town House
        // Main body
        makeBox(30, 20, 20, facade, 0, 10, -50);
        // Portico columns
        makeCyl(1, 1, 20, 8, 0xEEDDCC, -10, 10, -61);
        makeCyl(1, 1, 20, 8, 0xEEDDCC, -4, 10, -61);
        makeCyl(1, 1, 20, 8, 0xEEDDCC, 4, 10, -61);
        makeCyl(1, 1, 20, 8, 0xEEDDCC, 10, 10, -61);
        // Pediment
        makeBox(30, 6, 4, facade, 0, 22, -61);
        // Roof
        makeBox(32, 4, 22, roof, 0, 22, -50);
        // Cupola base
        makeBox(8, 4, 8, facade, 0, 25, -50);
        // Cupola drum
        makeCyl(3, 3, 6, 8, facade, 0, 30, -50);
        // Cupola dome
        makeSphere(3, 8, 8, roof, 0, 34, -50);
        // Cupola finial
        makeCyl(0.3, 0.3, 3, 6, 0x888888, 0, 37.5, -50);
    }

    function buildFloorscastle() {
        var lime = 0xF5F0E8;
        var roof = 0x778899;
        var tower = 0xE8DDD0;
        // Floors Castle — Georgian baroque, Duke of Roxburghe
        // Set well outside town to north-west
        // Central block
        makeBox(60, 28, 40, lime, -200, 14, -200);
        // Central roof
        makeBox(62, 6, 42, roof, -200, 30, -200);
        // Central battlemented parapet
        makeBox(62, 4, 4, tower, -200, 33, -180);
        makeBox(62, 4, 4, tower, -200, 33, -220);
        makeBox(4, 4, 42, tower, -169, 33, -200);
        makeBox(4, 4, 42, tower, -231, 33, -200);

        // East wing
        makeBox(30, 22, 30, lime, -160, 11, -200);
        makeBox(30, 4, 30, roof, -160, 23, -200);
        // West wing
        makeBox(30, 22, 30, lime, -240, 11, -200);
        makeBox(30, 4, 30, roof, -240, 23, -200);

        // Corner towers (Dutch-influenced skyline)
        makeCyl(4, 4, 36, 8, tower, -182, 18, -182);
        makeCone(5, 8, 8, roof, -182, 40, -182);
        makeCyl(4, 4, 36, 8, tower, -218, 18, -182);
        makeCone(5, 8, 8, roof, -218, 40, -182);
        makeCyl(4, 4, 36, 8, tower, -182, 18, -218);
        makeCone(5, 8, 8, roof, -182, 40, -218);
        makeCyl(4, 4, 36, 8, tower, -218, 18, -218);
        makeCone(5, 8, 8, roof, -218, 40, -218);

        // Multiple chimneys (signature skyline feature)
        makeCyl(0.8, 0.8, 8, 6, 0x888888, -195, 34, -185);
        makeCyl(0.8, 0.8, 8, 6, 0x888888, -200, 34, -185);
        makeCyl(0.8, 0.8, 8, 6, 0x888888, -205, 34, -185);
        makeCyl(0.8, 0.8, 8, 6, 0x888888, -195, 34, -215);
        makeCyl(0.8, 0.8, 8, 6, 0x888888, -205, 34, -215);
        makeCyl(0.8, 0.8, 8, 6, 0x888888, -163, 26, -195);
        makeCyl(0.8, 0.8, 8, 6, 0x888888, -163, 26, -205);
        makeCyl(0.8, 0.8, 8, 6, 0x888888, -237, 26, -195);
        makeCyl(0.8, 0.8, 8, 6, 0x888888, -237, 26, -205);

        // Castle driveway
        makeBox(10, 1, 200, 0xCCBB99, -200, 0, -100);
        // Castle grounds lawn
        makeBox(200, 1, 200, 0x4A8A3A, -200, 0, -200);
        // Gate piers
        makeCyl(2, 2, 10, 6, tower, -207, 5, -100);
        makeCyl(2, 2, 10, 6, tower, -193, 5, -100);
        makeCone(2.5, 4, 6, roof, -207, 12, -100);
        makeCone(2.5, 4, 6, roof, -193, 12, -100);
    }

    function buildKelsoRacecourse() {
        var turf = 0x4A7C3F;
        var stand = 0xDDCCBB;
        var rail = 0xFFFFFF;
        // Kelso Racecourse — oval track
        // Track surface (oval approximated with boxes)
        makeBox(200, 1, 20, turf, 200, 0, 100);
        makeBox(200, 1, 20, turf, 200, 0, -100);
        makeBox(20, 1, 220, turf, 100, 0, 0);
        makeBox(20, 1, 220, turf, 300, 0, 0);
        // Inner grass
        makeBox(160, 1, 180, 0x5A9A4A, 200, 0, 0);
        // End curves (approximated with boxes)
        makeBox(60, 1, 60, turf, 110, 0, 100);
        makeBox(60, 1, 60, turf, 290, 0, 100);
        makeBox(60, 1, 60, turf, 110, 0, -100);
        makeBox(60, 1, 60, turf, 290, 0, -100);
        // Grandstand main building
        makeBox(80, 14, 20, stand, 200, 7, -118);
        // Grandstand roof
        makeBox(82, 4, 6, 0x556677, 200, 14, -126);
        // Grandstand tiered seating (steps)
        makeBox(80, 3, 6, 0xCCBBAA, 200, 3, -112);
        makeBox(80, 3, 6, 0xCCBBAA, 200, 6, -109);
        makeBox(80, 3, 6, 0xCCBBAA, 200, 9, -106);
        // Parade ring
        makeCyl(20, 20, 1, 12, 0x5A8A3A, 200, 0, -140);
        // Winning post
        makeCyl(0.3, 0.3, 8, 6, rail, 200, 4, -115);
        // Railing along home straight
        makeBox(200, 2, 1, rail, 200, 1, -100);
    }

    function buildRoxburghCastle() {
        var ruin = 0x8B7355;
        var dark = 0x6B5335;
        // Roxburgh Castle — ruined motte across the river
        // Motte mound
        makeCyl(30, 40, 12, 8, 0x7A6A45, 120, 6, 200);
        // Keep ruins on motte
        makeBox(18, 16, 18, ruin, 120, 14, 200);
        // Ruined wall fragments
        makeBox(3, 14, 20, ruin, 107, 13, 200);
        makeBox(22, 12, 3, ruin, 120, 13, 209);
        makeBox(22, 6, 3, dark, 120, 9, 191);
        makeBox(3, 10, 14, dark, 133, 11, 200);
        // Collapsed section
        makeBox(12, 4, 8, ruin, 125, 10, 200);
        // Outer bailey wall remnants
        makeBox(2, 5, 50, ruin, 95, 8.5, 200);
        makeBox(50, 2, 2, ruin, 120, 5, 230);
        // Rubble piles
        makeSphere(3, 6, 6, ruin, 115, 2, 195);
        makeSphere(2, 6, 6, dark, 128, 1.5, 208);
    }

    function buildEdnamVillage() {
        var house = 0xDDD0BA;
        var roof = 0x886655;
        var stone = 0xC8B89A;
        // Ednam village — birthplace of James Thomson (poet, "Rule Britannia" / "The Seasons")
        // Set north of town
        // Village church
        makeBox(14, 14, 22, stone, -80, 7, -280);
        makeCyl(3, 3, 20, 8, stone, -80, 17, -291);
        makeCone(3.5, 8, 8, 0x666655, -80, 27, -291);
        // Church porch
        makeBox(6, 8, 6, stone, -80, 4, -269);
        // James Thomson memorial / cottage
        makeBox(12, 7, 10, house, -100, 3.5, -270);
        makeBox(14, 3, 12, roof, -100, 8, -270);
        // Village houses
        makeBox(10, 7, 9, house, -86, 3.5, -265);
        makeBox(10, 3, 11, roof, -86, 8, -265);
        makeBox(10, 7, 9, house, -70, 3.5, -265);
        makeBox(10, 3, 11, roof, -70, 8, -265);
        makeBox(10, 7, 9, house, -115, 3.5, -260);
        makeBox(10, 3, 11, roof, -115, 8, -260);
        // Village green
        makeBox(40, 1, 30, 0x5A8A3A, -90, 0, -260);
        // Village road
        makeBox(8, 1, 100, 0x666655, -80, 0, -270);
    }

    function buildTownBuildings() {
        var georgian = 0xDDD5C0;
        var darker = 0xBBAA90;
        var roof = 0x996655;
        var darkroof = 0x775544;
        // Georgian town houses around the square
        // North side of square
        makeBox(16, 16, 14, georgian, -55, 8, -90);
        makeBox(16, 3, 16, roof, -55, 17.5, -90);
        makeBox(16, 16, 14, georgian, -35, 8, -90);
        makeBox(16, 3, 16, roof, -35, 17.5, -90);
        makeBox(16, 16, 14, georgian, -15, 8, -90);
        makeBox(16, 3, 16, roof, -15, 17.5, -90);
        makeBox(16, 16, 14, georgian, 5, 8, -90);
        makeBox(16, 3, 16, roof, 5, 17.5, -90);
        makeBox(16, 16, 14, georgian, 25, 8, -90);
        makeBox(16, 3, 16, roof, 25, 17.5, -90);
        makeBox(16, 16, 14, georgian, 45, 8, -90);
        makeBox(16, 3, 16, roof, 45, 17.5, -90);

        // East side of square
        makeBox(14, 14, 16, darker, 70, 7, -40);
        makeBox(14, 3, 18, darkroof, 70, 14.5, -40);
        makeBox(14, 14, 16, darker, 70, 7, -20);
        makeBox(14, 3, 18, darkroof, 70, 14.5, -20);
        makeBox(14, 14, 16, darker, 70, 7, -60);
        makeBox(14, 3, 18, darkroof, 70, 14.5, -60);

        // West side of square
        makeBox(14, 14, 16, darker, -70, 7, -40);
        makeBox(14, 3, 18, darkroof, -70, 14.5, -40);
        makeBox(14, 14, 16, darker, -70, 7, -20);
        makeBox(14, 3, 18, darkroof, -70, 14.5, -20);

        // Inn / hotel (Border Hotel style)
        makeBox(20, 18, 18, georgian, 60, 9, -90);
        makeBox(20, 4, 20, roof, 60, 20, -90);
        makeCyl(0.5, 0.5, 6, 6, 0x222222, 55, 21, -80);
        makeCyl(0.5, 0.5, 6, 6, 0x222222, 65, 21, -80);

        // Bakery / shops south side
        makeBox(14, 10, 10, 0xCCBBA0, -20, 5, 25);
        makeBox(14, 10, 10, 0xCCBBA0, -5, 5, 25);
        makeBox(14, 10, 10, 0xCCBBA0, 10, 5, 25);
        // Church (Kelso Old Parish Church)
        makeBox(18, 20, 28, 0xC8B89A, -120, 10, -40);
        makeCyl(3.5, 3.5, 24, 8, 0xC8B89A, -120, 22, -54);
        makeCone(4, 10, 8, 0x777766, -120, 35, -54);
    }

    function buildVegetation() {
        var dark = 0x2D5A1B;
        var mid = 0x3D7A2B;
        var light = 0x4A9A38;
        // Trees along river banks
        makeCyl(0.5, 0.8, 10, 6, 0x5A3A1A, 15, 5, 40);
        makeSphere(4, 6, 6, dark, 15, 12, 40);
        makeCyl(0.5, 0.8, 10, 6, 0x5A3A1A, 15, 5, 80);
        makeSphere(4, 6, 6, mid, 15, 12, 80);
        makeCyl(0.5, 0.8, 10, 6, 0x5A3A1A, 15, 5, 120);
        makeSphere(4, 6, 6, dark, 15, 12, 120);
        makeCyl(0.5, 0.8, 12, 6, 0x5A3A1A, 105, 6, 20);
        makeSphere(5, 6, 6, mid, 105, 14, 20);
        makeCyl(0.5, 0.8, 12, 6, 0x5A3A1A, 105, 6, 60);
        makeSphere(5, 6, 6, light, 105, 14, 60);
        makeCyl(0.5, 0.8, 12, 6, 0x5A3A1A, 105, 6, 100);
        makeSphere(5, 6, 6, dark, 105, 14, 100);
        // Abbey grounds trees
        makeCyl(0.6, 0.9, 12, 6, 0x5A3A1A, -20, 6, -110);
        makeSphere(5, 6, 6, dark, -20, 14, -110);
        makeCyl(0.6, 0.9, 12, 6, 0x5A3A1A, -20, 6, -140);
        makeSphere(5, 6, 6, mid, -20, 14, -140);
        makeCyl(0.6, 0.9, 14, 6, 0x5A3A1A, -65, 7, -110);
        makeSphere(6, 6, 6, dark, -65, 15, -110);
        // Floors Castle grounds trees (formal avenue)
        makeCyl(0.6, 0.8, 14, 6, 0x4A3A1A, -196, 7, -110);
        makeSphere(5, 6, 6, dark, -196, 15, -110);
        makeCyl(0.6, 0.8, 14, 6, 0x4A3A1A, -204, 7, -110);
        makeSphere(5, 6, 6, mid, -204, 15, -110);
        makeCyl(0.6, 0.8, 14, 6, 0x4A3A1A, -196, 7, -130);
        makeSphere(5, 6, 6, dark, -196, 15, -130);
        makeCyl(0.6, 0.8, 14, 6, 0x4A3A1A, -204, 7, -130);
        makeSphere(5, 6, 6, light, -204, 15, -130);
        makeCyl(0.6, 0.8, 14, 6, 0x4A3A1A, -196, 7, -150);
        makeSphere(5, 6, 6, mid, -196, 15, -150);
        makeCyl(0.6, 0.8, 14, 6, 0x4A3A1A, -204, 7, -150);
        makeSphere(5, 6, 6, dark, -204, 15, -150);
        // Racecourse trees
        makeCyl(0.5, 0.7, 10, 6, 0x5A3A1A, 170, 5, -80);
        makeSphere(4, 6, 6, mid, 170, 12, -80);
        makeCyl(0.5, 0.7, 10, 6, 0x5A3A1A, 230, 5, -80);
        makeSphere(4, 6, 6, dark, 230, 12, -80);
        // Salmon fishing bank vegetation
        makeCyl(0.4, 0.6, 8, 6, 0x5A3A1A, -25, 4, 80);
        makeSphere(3, 6, 6, mid, -25, 10, 80);
        makeCyl(0.4, 0.6, 8, 6, 0x5A3A1A, -35, 4, 90);
        makeSphere(3, 6, 6, light, -35, 10, 90);
    }

    function update(delta) {
        // No per-frame animation needed for static environment
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
