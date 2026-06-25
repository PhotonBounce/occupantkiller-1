window.BishkekAlaToo = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 23880;
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
        return makeMesh(new THREE.BoxGeometry(w, h, d), color, x, y, z);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        return makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs), color, x, y, z);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        return makeMesh(new THREE.SphereGeometry(r, ws, hs), color, x, y, z);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        return makeMesh(new THREE.ConeGeometry(r, h, segs), color, x, y, z);
    }

    function buildGround() {
        // Main city ground plane via large flat box
        makeBox(2000, 0.5, 2000, 0x5A7A40, 0, -0.25, 0);
        // Ala-Too Square paved area
        makeBox(300, 0.6, 200, 0xD4D0C8, 0, 0.05, 0);
        // Square border strips
        makeBox(304, 0.4, 4, 0xBBBBBB, 0, 0.05, 102);
        makeBox(304, 0.4, 4, 0xBBBBBB, 0, 0.05, -102);
        makeBox(4, 0.4, 200, 0xBBBBBB, 152, 0.05, 0);
        makeBox(4, 0.4, 200, 0xBBBBBB, -152, 0.05, 0);
    }

    function buildFlagpole() {
        // Tall flagpole at center of Ala-Too Square
        makeCyl(0.4, 0.5, 60, 8, 0xAAAAAA, 0, 30, 0);
        // Flag - red background (Kyrgyz flag is red)
        makeBox(20, 12, 0.3, 0xEE0000, 10, 57, 0);
        // Sun circle on flag
        makeCyl(3, 3, 0.4, 16, 0xFFDD00, 10, 57, 0);
        // Flagpole base
        makeCyl(1.5, 2, 3, 8, 0x888888, 0, 1.5, 0);
    }

    function buildManasStatue() {
        // Manas statue on pedestal - center square hero
        makeBox(8, 4, 8, 0xAA9977, -20, 2, 0);   // pedestal base
        makeBox(6, 6, 6, 0x998866, -20, 7, 0);    // pedestal middle
        makeBox(4, 4, 4, 0x887755, -20, 11, 0);   // pedestal top
        // Figure body
        makeCyl(1.2, 1.5, 8, 8, 0x775544, -20, 18, 0);
        // Figure head
        makeSphere(1.5, 8, 8, 0xCC9966, -20, 23, 0);
        // Horse body
        makeBox(6, 3, 2, 0x664433, -20, 15, 0);
        // Horse head
        makeBox(2, 2, 1.5, 0x664433, -23, 17, 0);
        // Horse legs
        makeCyl(0.3, 0.3, 4, 6, 0x554422, -18, 12.5, 0.5);
        makeCyl(0.3, 0.3, 4, 6, 0x554422, -22, 12.5, 0.5);
        makeCyl(0.3, 0.3, 4, 6, 0x554422, -18, 12.5, -0.5);
        makeCyl(0.3, 0.3, 4, 6, 0x554422, -22, 12.5, -0.5);
    }

    function buildStateHistoricalMuseum() {
        // State Historical Museum - large Soviet-era building
        makeBox(80, 20, 40, 0xD4C8B0, -80, 10, 60);
        // Columns row
        makeCyl(1.2, 1.2, 22, 8, 0xEEEEEE, -60, 11, 42);
        makeCyl(1.2, 1.2, 22, 8, 0xEEEEEE, -68, 11, 42);
        makeCyl(1.2, 1.2, 22, 8, 0xEEEEEE, -76, 11, 42);
        makeCyl(1.2, 1.2, 22, 8, 0xEEEEEE, -84, 11, 42);
        makeCyl(1.2, 1.2, 22, 8, 0xEEEEEE, -92, 11, 42);
        makeCyl(1.2, 1.2, 22, 8, 0xEEEEEE, -100, 11, 42);
        // Pediment / triangular roof gable
        makeBox(84, 4, 2, 0xCCBB99, -80, 22, 42);
        // Museum roof
        makeBox(82, 3, 42, 0xBBAA88, -80, 22, 60);
        // Museum steps
        makeBox(50, 1, 6, 0xCCCCBB, -80, 0.5, 40);
        makeBox(44, 1, 5, 0xCCCCBB, -80, 1.5, 38);
    }

    function buildEternalFlame() {
        // Eternal flame pedestal at Ala-Too
        makeCyl(3, 4, 2, 8, 0x999999, 30, 1, 0);
        makeCyl(2, 2, 3, 8, 0xAAAAAA, 30, 3.5, 0);
        // Flame shapes
        makeCone(1.5, 5, 8, 0xFF6600, 30, 7.5, 0);
        makeCone(1.0, 4, 8, 0xFFAA00, 30, 7, 0.5);
        makeCone(0.8, 3, 8, 0xFFFF00, 30, 6.5, -0.3);
    }

    function buildWhiteHouse() {
        // Government White House - Soviet neoclassical
        // Main body
        makeBox(120, 30, 50, 0xF0EDE8, 0, 15, -150);
        // Left wing
        makeBox(30, 25, 40, 0xEEEBE5, -65, 12.5, -155);
        // Right wing
        makeBox(30, 25, 40, 0xEEEBE5, 65, 12.5, -155);
        // Central portico / entrance
        makeBox(30, 34, 8, 0xF5F2EE, 0, 17, -127);
        // Columns on White House facade
        makeCyl(1.0, 1.0, 32, 8, 0xFFFFFF, -12, 16, -127);
        makeCyl(1.0, 1.0, 32, 8, 0xFFFFFF, -6, 16, -127);
        makeCyl(1.0, 1.0, 32, 8, 0xFFFFFF, 0, 16, -127);
        makeCyl(1.0, 1.0, 32, 8, 0xFFFFFF, 6, 16, -127);
        makeCyl(1.0, 1.0, 32, 8, 0xFFFFFF, 12, 16, -127);
        // Pediment above portico
        makeBox(32, 5, 3, 0xEEEBE5, 0, 34, -127);
        // Roof
        makeBox(122, 4, 52, 0xDDDDD0, 0, 32, -150);
        // Steps
        makeBox(28, 1, 8, 0xDDDDDD, 0, 0.5, -123);
        makeBox(24, 1, 6, 0xDDDDDD, 0, 1.5, -121);
        // Flagpoles on White House
        makeCyl(0.2, 0.2, 18, 6, 0xAAAAAA, -10, 9, -127);
        makeCyl(0.2, 0.2, 18, 6, 0xAAAAAA, 10, 9, -127);
        makeBox(6, 4, 0.2, 0xEE0000, -7, 17, -127);
        makeBox(6, 4, 0.2, 0xEE0000, 13, 17, -127);
    }

    function buildVictorySquare() {
        // Victory Square - WWII memorial with three yurt-arch pylons
        // Ground plaza
        makeBox(120, 0.5, 120, 0xCCCCCC, 200, 0.25, 0);
        // Three arch pylons (yurt-shaped arches)
        // Pylon 1 left leg
        makeBox(4, 30, 4, 0xBBBBBB, 185, 15, -15);
        // Pylon 1 right leg
        makeBox(4, 30, 4, 0xBBBBBB, 215, 15, -15);
        // Pylon 1 arch cap
        makeBox(34, 4, 4, 0xBBBBBB, 200, 30, -15);
        // Arch curve top (cone approximation)
        makeCyl(5, 5, 4, 8, 0xAAAAAA, 200, 32, -15);
        // Pylon 2 left
        makeBox(4, 30, 4, 0xBBBBBB, 185, 15, 0);
        makeBox(4, 30, 4, 0xBBBBBB, 215, 15, 0);
        makeBox(34, 4, 4, 0xBBBBBB, 200, 30, 0);
        // Pylon 3 right
        makeBox(4, 30, 4, 0xBBBBBB, 185, 15, 15);
        makeBox(4, 30, 4, 0xBBBBBB, 215, 15, 15);
        makeBox(34, 4, 4, 0xBBBBBB, 200, 30, 15);
        // Central eternal flame bowl
        makeCyl(3, 4, 3, 12, 0x888888, 200, 1.5, 0);
        makeCone(2, 6, 8, 0xFF6600, 200, 7, 0);
        makeCone(1.2, 5, 8, 0xFFAA00, 200, 6.5, 0);
        // Mother figure statue
        makeCyl(1, 1.5, 10, 8, 0xAA9977, 170, 5, 0);
        makeSphere(2, 8, 8, 0xCC9966, 170, 11, 0);
        // Statue arms
        makeBox(8, 1.5, 1.5, 0xBBAA88, 170, 9, 0);
    }

    function buildBuranaMinaret() {
        // Burana Tower - 11th century minaret
        // Base
        makeCyl(6, 8, 5, 12, 0xC8B880, -200, 2.5, 100);
        // Lower tower section
        makeCyl(5, 6, 20, 12, 0xC8B880, -200, 15, 100);
        // Upper tower section (slightly narrower)
        makeCyl(3.5, 5, 15, 12, 0xBBAA70, -200, 30, 100);
        // Top band
        makeCyl(4, 3.5, 3, 12, 0xDDCC99, -200, 39, 100);
        // Conical top
        makeCone(4, 8, 12, 0xAA9966, -200, 45, 100);
        // Balbal stone figures around base
        makeBox(1.5, 3, 1, 0x887755, -208, 1.5, 100);
        makeBox(1.5, 3, 1, 0x887755, -192, 1.5, 100);
        makeBox(1, 3, 1.5, 0x887755, -200, 1.5, 108);
        makeBox(1, 3, 1.5, 0x887755, -200, 1.5, 92);
        makeSphere(0.8, 6, 6, 0x998866, -208, 4, 100);
        makeSphere(0.8, 6, 6, 0x998866, -192, 4, 100);
    }

    function buildStateOpera() {
        // State Opera House - neoclassical theatre
        makeBox(70, 20, 35, 0xD4C8B0, -150, 10, -100);
        // Columns facade
        makeCyl(1.0, 1.0, 22, 8, 0xEEDDAA, -130, 11, -84);
        makeCyl(1.0, 1.0, 22, 8, 0xEEDDAA, -138, 11, -84);
        makeCyl(1.0, 1.0, 22, 8, 0xEEDDAA, -146, 11, -84);
        makeCyl(1.0, 1.0, 22, 8, 0xEEDDAA, -154, 11, -84);
        makeCyl(1.0, 1.0, 22, 8, 0xEEDDAA, -162, 11, -84);
        makeCyl(1.0, 1.0, 22, 8, 0xEEDDAA, -170, 11, -84);
        // Pediment
        makeBox(74, 5, 3, 0xCCBB99, -150, 22, -84);
        // Dome
        makeSphere(12, 12, 12, 0xBBAA88, -150, 28, -100);
        // Roof platform under dome
        makeCyl(13, 13, 3, 16, 0xCCBBAA, -150, 21, -100);
        // Steps
        makeBox(50, 1, 7, 0xCCCCBB, -150, 0.5, -82);
    }

    function buildOshBazaar() {
        // Osh Bazaar - large outdoor market
        // Main market hall
        makeBox(100, 8, 60, 0xCC8833, 100, 4, 100);
        // Market roof
        makeBox(102, 2, 62, 0xBB7722, 100, 9, 100);
        // Stall rows inside/around
        makeBox(20, 4, 8, 0xDD9944, 80, 2, 85);
        makeBox(20, 4, 8, 0xCC8833, 100, 2, 85);
        makeBox(20, 4, 8, 0xBB7733, 120, 2, 85);
        makeBox(20, 4, 8, 0xDD9944, 80, 2, 115);
        makeBox(20, 4, 8, 0xCC8833, 100, 2, 115);
        makeBox(20, 4, 8, 0xBB7733, 120, 2, 115);
        // Spice mound displays
        makeCone(2, 3, 8, 0xFFAA00, 85, 3, 92);
        makeCone(2, 3, 8, 0xFF8800, 90, 3, 92);
        makeCone(2, 3, 8, 0xDD4400, 95, 3, 92);
        makeCone(2, 3, 8, 0xFFCC00, 100, 3, 92);
        // Felt product stacks (rolled felt - cylinder shapes)
        makeCyl(1.5, 1.5, 6, 8, 0xFF3333, 110, 3, 92);
        makeCyl(1.5, 1.5, 6, 8, 0x3333FF, 114, 3, 92);
        makeCyl(1.5, 1.5, 6, 8, 0x33AA33, 118, 3, 92);
    }

    function buildDordoiBazaar() {
        // Dordoi Bazaar - shipping container market
        // Rows of stacked containers
        var dz = -200;
        var dx = 150;
        // Row 1
        makeBox(12, 3, 6, 0x8899AA, dx, 1.5, dz);
        makeBox(12, 3, 6, 0x7788BB, dx + 14, 1.5, dz);
        makeBox(12, 3, 6, 0x99AABB, dx + 28, 1.5, dz);
        makeBox(12, 3, 6, 0x8899AA, dx + 42, 1.5, dz);
        makeBox(12, 3, 6, 0x7788BB, dx + 56, 1.5, dz);
        // Stacked second level
        makeBox(12, 3, 6, 0x9AABBC, dx, 4.5, dz);
        makeBox(12, 3, 6, 0x8899AA, dx + 14, 4.5, dz);
        makeBox(12, 3, 6, 0x7788BB, dx + 28, 4.5, dz);
        makeBox(12, 3, 6, 0x99AABB, dx + 42, 4.5, dz);
        makeBox(12, 3, 6, 0x8899AA, dx + 56, 4.5, dz);
        // Row 2 (parallel alley)
        makeBox(12, 3, 6, 0x7788BB, dx, 1.5, dz - 12);
        makeBox(12, 3, 6, 0x8899AA, dx + 14, 1.5, dz - 12);
        makeBox(12, 3, 6, 0x99AABB, dx + 28, 1.5, dz - 12);
        makeBox(12, 3, 6, 0x8899AA, dx + 42, 1.5, dz - 12);
        makeBox(12, 3, 6, 0x7788BB, dx + 56, 1.5, dz - 12);
        makeBox(12, 3, 6, 0x9AABBC, dx, 4.5, dz - 12);
        makeBox(12, 3, 6, 0x8899AA, dx + 14, 4.5, dz - 12);
    }

    function buildYurt() {
        // Traditional Kyrgyz Yurt
        // Circular base/floor
        makeCyl(8, 8, 0.5, 16, 0xDDCCBB, -100, 0.25, 150);
        // Lattice walls (trellis approximated as low cylinder)
        makeCyl(7.8, 7.8, 4, 16, 0xEEDDCC, -100, 2, 150);
        // Dome roof
        makeSphere(8, 12, 8, 0xFFEEDD, -100, 8, 150);
        // Chimney/toono (crown ring)
        makeCyl(1.5, 1.5, 1.5, 12, 0xDDCCBB, -100, 12, 150);
        // Door frame
        makeBox(3, 5, 0.5, 0xAA8855, -92.2, 2.5, 150);
        // Decorative band around wall
        makeBox(0.5, 0.8, 50, 0xAA3333, -100, 4.2, 150);
        // Yurt interior pole (bagana)
        makeCyl(0.3, 0.3, 7, 6, 0xBB9966, -100, 3.5, 150);
    }

    function buildAlaArcha() {
        // Ala Archa National Park gorge and mountains
        var px = -300;
        var pz = -300;

        // Rocky gorge floor (river valley)
        makeBox(200, 2, 80, 0x7A6A50, px, 1, pz);

        // River (light blue-grey)
        makeBox(10, 0.5, 200, 0x7799BB, px, 1.1, pz);

        // Alpine meadow patches
        makeBox(60, 0.6, 30, 0x4A7A3A, px - 50, 0.6, pz - 30);
        makeBox(40, 0.6, 25, 0x3A6A2A, px + 40, 0.6, pz - 25);

        // Mountain peaks - tall rugged shapes using cones and cylinders
        // Peak 1 - Khan Tengri style
        makeCyl(20, 35, 80, 8, 0x8899AA, px - 80, 40, pz - 80);
        makeCone(18, 60, 8, 0x99AABB, px - 80, 110, pz - 80);
        // Snow cap
        makeCone(10, 25, 8, 0xEEEEFF, px - 80, 148, pz - 80);

        // Peak 2
        makeCyl(18, 28, 60, 8, 0x778899, px, 30, pz - 100);
        makeCone(15, 50, 8, 0x8899AA, px, 85, pz - 100);
        makeCone(8, 20, 8, 0xDDDDEE, px, 120, pz - 100);

        // Peak 3
        makeCyl(15, 25, 50, 8, 0x88998A, px + 70, 25, pz - 90);
        makeCone(14, 45, 8, 0x9AABAC, px + 70, 72, pz - 90);
        makeCone(7, 18, 8, 0xCCCCDD, px + 70, 106, pz - 90);

        // Ak-Sai glacier (white flat mass on mountain)
        makeBox(40, 5, 20, 0xDDEEFF, px - 70, 100, pz - 70);
        makeBox(30, 4, 15, 0xCCDDEE, px - 60, 90, pz - 75);

        // Rocky outcroppings
        makeBox(8, 6, 8, 0x887766, px - 30, 3, pz - 20);
        makeBox(6, 5, 6, 0x776655, px + 30, 3, pz - 30);
        makeBox(10, 8, 7, 0x998877, px - 50, 4, pz + 10);
        makeSphere(4, 6, 6, 0x887766, px + 50, 4, pz - 10);

        // Foothill ridges
        makeCyl(12, 20, 25, 8, 0x779966, px - 100, 12.5, pz + 30);
        makeCyl(10, 18, 20, 8, 0x668855, px + 80, 10, pz + 20);

        // Pine trees (cone + cylinder)
        makeCyl(0.5, 0.5, 5, 6, 0x553311, px - 10, 2.5, pz + 10);
        makeCone(3, 8, 6, 0x225522, px - 10, 9, pz + 10);
        makeCyl(0.5, 0.5, 5, 6, 0x553311, px + 15, 2.5, pz + 5);
        makeCone(3, 8, 6, 0x226622, px + 15, 9, pz + 5);
        makeCyl(0.5, 0.5, 5, 6, 0x553311, px - 25, 2.5, pz + 15);
        makeCone(3, 8, 6, 0x335533, px - 25, 9, pz + 15);
    }

    function buildTianShanBackdrop() {
        // Tian Shan distant mountain backdrop
        // Massive background mountain range
        makeCyl(50, 80, 180, 8, 0x7788AA, -500, 90, -400);
        makeCone(45, 120, 8, 0x8899BB, -500, 240, -400);
        makeCone(25, 50, 8, 0xDDEEFF, -500, 335, -400);

        makeCyl(40, 65, 160, 8, 0x6677AA, -380, 80, -420);
        makeCone(38, 100, 8, 0x7788BB, -380, 210, -420);
        makeCone(20, 40, 8, 0xCCDDFF, -380, 295, -420);

        makeCyl(45, 70, 170, 8, 0x778899, -620, 85, -380);
        makeCone(40, 110, 8, 0x8899AA, -620, 225, -380);
        makeCone(22, 45, 8, 0xDDEEFF, -620, 315, -380);

        // Foothills in front
        makeCyl(30, 55, 80, 8, 0x5A7A60, -450, 40, -300);
        makeCyl(25, 45, 70, 8, 0x4A6A50, -560, 35, -280);
        makeCyl(35, 60, 90, 8, 0x6A8A70, -340, 45, -310);
    }

    function buildRoads() {
        // Main boulevard (Chuy Avenue approximation)
        makeBox(600, 0.4, 20, 0x555555, 0, 0.2, 30);
        makeBox(600, 0.4, 20, 0x555555, 0, 0.2, -30);
        // Cross street
        makeBox(20, 0.4, 400, 0x555555, 0, 0.2, 0);
        // Road divider strips
        makeBox(600, 0.5, 2, 0xFFFFAA, 0, 0.25, 0);
        makeBox(2, 0.5, 400, 0xFFFFAA, 0, 0.25, 0);
        // Sidewalks
        makeBox(600, 0.3, 8, 0xCCCCCC, 0, 0.15, 42);
        makeBox(600, 0.3, 8, 0xCCCCCC, 0, 0.15, -42);
    }

    function buildStreetLamps() {
        // Street lamp posts along the square
        makeCyl(0.3, 0.3, 10, 6, 0x666677, -60, 5, 45);
        makeSphere(1.2, 6, 6, 0xFFFF99, -60, 10.5, 45);
        makeCyl(0.3, 0.3, 10, 6, 0x666677, -30, 5, 45);
        makeSphere(1.2, 6, 6, 0xFFFF99, -30, 10.5, 45);
        makeCyl(0.3, 0.3, 10, 6, 0x666677, 0, 5, 45);
        makeSphere(1.2, 6, 6, 0xFFFF99, 0, 10.5, 45);
        makeCyl(0.3, 0.3, 10, 6, 0x666677, 30, 5, 45);
        makeSphere(1.2, 6, 6, 0xFFFF99, 30, 10.5, 45);
        makeCyl(0.3, 0.3, 10, 6, 0x666677, 60, 5, 45);
        makeSphere(1.2, 6, 6, 0xFFFF99, 60, 10.5, 45);
    }

    function buildCityBlocks() {
        // Surrounding city buildings
        makeBox(30, 25, 20, 0xCCAA88, -200, 12.5, 50);
        makeBox(25, 18, 20, 0xBB9977, -240, 9, 50);
        makeBox(20, 30, 20, 0xDDBB99, -170, 15, 50);
        makeBox(35, 20, 20, 0xCC9966, 200, 10, -50);
        makeBox(28, 35, 20, 0xBBAA88, 240, 17.5, -50);
        makeBox(22, 22, 20, 0xCCBB99, 160, 11, -50);
        makeBox(30, 15, 20, 0xAA8866, -200, 7.5, -50);
        makeBox(25, 28, 20, 0xBB9977, 150, 14, 50);
    }

    function buildPark() {
        // Park trees around the square
        makeCyl(0.6, 0.6, 6, 6, 0x554422, 60, 3, 80);
        makeSphere(4, 8, 8, 0x336633, 60, 10, 80);
        makeCyl(0.6, 0.6, 6, 6, 0x554422, 80, 3, 80);
        makeSphere(4, 8, 8, 0x447744, 80, 10, 80);
        makeCyl(0.6, 0.6, 6, 6, 0x554422, 100, 3, 80);
        makeSphere(4, 8, 8, 0x335533, 100, 10, 80);
        makeCyl(0.6, 0.6, 6, 6, 0x554422, -60, 3, 80);
        makeSphere(4, 8, 8, 0x448844, -60, 10, 80);
        makeCyl(0.6, 0.6, 6, 6, 0x554422, -80, 3, 80);
        makeSphere(4, 8, 8, 0x336633, -80, 10, 80);
        makeCyl(0.6, 0.6, 6, 6, 0x554422, -100, 3, 80);
        makeSphere(4, 8, 8, 0x447744, -100, 10, 80);
    }

    function build() {
        buildGround();
        buildFlagpole();
        buildManasStatue();
        buildStateHistoricalMuseum();
        buildEternalFlame();
        buildWhiteHouse();
        buildVictorySquare();
        buildBuranaMinaret();
        buildStateOpera();
        buildOshBazaar();
        buildDordoiBazaar();
        buildYurt();
        buildAlaArcha();
        buildTianShanBackdrop();
        buildRoads();
        buildStreetLamps();
        buildCityBlocks();
        buildPark();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
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
