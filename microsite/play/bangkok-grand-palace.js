window.BangkokGrandPalace = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 24560;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), OY + (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        if (sx) mesh.scale.set(sx, sy || sx, sz || sx);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildChaoPhrayaRiver();
        buildGrandPalace();
        buildWatArun();
        buildBaiyokeTower();
        buildWatPho();
        buildChatuchakMarket();
        buildLumphiniPark();
        buildMBKSiamParagon();
        buildKhaoSanRoad();
        buildDamnoenSaduak();
    }

    // -----------------------------------------------------------------------
    // Chao Phraya River
    // -----------------------------------------------------------------------
    function buildChaoPhrayaRiver() {
        // Main river body (wide flat box)
        makeMesh(new THREE.BoxGeometry(600, 2, 180), 0x2A5A7A, -50, -1, 60);

        // Express boat 1
        makeMesh(new THREE.BoxGeometry(18, 3, 6), 0xCC4422, -80, 1, 55);
        makeMesh(new THREE.BoxGeometry(16, 2, 5), 0xEEDDCC, -80, 3.5, 55);
        makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 6, 6), 0x333333, -75, 4, 55);

        // Longtail boat 1
        makeMesh(new THREE.BoxGeometry(10, 2, 3), 0xAA8833, -40, 1, 80);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 5, 6), 0x222222, -38, 3, 80);

        // Longtail boat 2
        makeMesh(new THREE.BoxGeometry(10, 2, 3), 0x885522, -20, 1, 65);

        // Ferry
        makeMesh(new THREE.BoxGeometry(30, 4, 10), 0xDDCC99, 30, 1, 70);
        makeMesh(new THREE.BoxGeometry(28, 3, 8), 0xEEEEDD, 30, 5.5, 70);

        // Klong (canal) side branch
        makeMesh(new THREE.BoxGeometry(200, 1, 20), 0x336677, 0, -0.5, -30);

        // Klong boat
        makeMesh(new THREE.BoxGeometry(8, 1.5, 2.5), 0x996633, 10, 0.5, -30);
    }

    // -----------------------------------------------------------------------
    // Grand Palace Complex
    // -----------------------------------------------------------------------
    function buildGrandPalace() {
        // Outer palace wall - 4 sides
        makeMesh(new THREE.BoxGeometry(200, 10, 4), 0xF5EE32, 0, 5, -100);   // north wall
        makeMesh(new THREE.BoxGeometry(200, 10, 4), 0xF5EE32, 0, 5, 0);      // south wall
        makeMesh(new THREE.BoxGeometry(4, 10, 100), 0xF5EE32, -100, 5, -50); // west wall
        makeMesh(new THREE.BoxGeometry(4, 10, 100), 0xF5EE32, 100, 5, -50);  // east wall

        // Wall crenellations / corner towers
        makeMesh(new THREE.BoxGeometry(8, 14, 8), 0xF5EE32, -100, 7, -100);
        makeMesh(new THREE.BoxGeometry(8, 14, 8), 0xF5EE32, 100, 7, -100);
        makeMesh(new THREE.BoxGeometry(8, 14, 8), 0xF5EE32, -100, 7, 0);
        makeMesh(new THREE.BoxGeometry(8, 14, 8), 0xF5EE32, 100, 7, 0);

        // Phra Maha Monthien - main throne hall base
        makeMesh(new THREE.BoxGeometry(60, 6, 40), 0xF5EE32, -20, 3, -60);
        // Throne hall upper tier
        makeMesh(new THREE.BoxGeometry(50, 8, 32), 0xEEDD00, -20, 10, -60);
        // Throne hall roof tier 1
        makeMesh(new THREE.BoxGeometry(52, 3, 34), 0xCC9900, -20, 15, -60);
        // Throne hall roof tier 2
        makeMesh(new THREE.BoxGeometry(42, 3, 26), 0xCC9900, -20, 19, -60);
        // Throne hall roof tier 3 (peak)
        makeMesh(new THREE.BoxGeometry(32, 3, 18), 0xCC9900, -20, 23, -60);
        // Throne hall roof finial (cho fa spike)
        makeMesh(new THREE.CylinderGeometry(0.5, 1.5, 8, 8), 0xFFDD00, -20, 29, -60);

        // Wat Phra Kaew - Temple of the Emerald Buddha
        // Temple base platform
        makeMesh(new THREE.BoxGeometry(50, 4, 40), 0xF5EE32, 40, 2, -60);
        // Temple walls
        makeMesh(new THREE.BoxGeometry(44, 12, 34), 0xF5EE32, 40, 10, -60);
        // Green/gold tiered roof tier 1
        makeMesh(new THREE.BoxGeometry(46, 3, 36), 0x228833, 40, 18, -60);
        // Green roof tier 2
        makeMesh(new THREE.BoxGeometry(36, 3, 28), 0xFFCC00, 40, 22, -60);
        // Green roof tier 3
        makeMesh(new THREE.BoxGeometry(26, 3, 20), 0x228833, 40, 26, -60);
        // Gold peak
        makeMesh(new THREE.CylinderGeometry(0.6, 2, 10, 8), 0xFFCC00, 40, 33, -60);

        // Grand Prang (Khmer-style tower) 1 - center
        makeMesh(new THREE.CylinderGeometry(6, 8, 35, 8), 0xF5EE32, 0, 17, -50);
        makeMesh(new THREE.CylinderGeometry(3, 6, 10, 8), 0xFFDD00, 0, 39, -50);
        makeMesh(new THREE.ConeGeometry(3, 12, 8), 0xFFDD00, 0, 49, -50);

        // Grand Prang 2 - left
        makeMesh(new THREE.CylinderGeometry(4, 6, 28, 8), 0xF5EE32, -30, 14, -70);
        makeMesh(new THREE.CylinderGeometry(2, 4, 8, 8), 0xFFDD00, -30, 31, -70);
        makeMesh(new THREE.ConeGeometry(2, 9, 8), 0xFFDD00, -30, 40, -70);

        // Grand Prang 3 - right
        makeMesh(new THREE.CylinderGeometry(4, 6, 28, 8), 0xF5EE32, 30, 14, -70);
        makeMesh(new THREE.CylinderGeometry(2, 4, 8, 8), 0xFFDD00, 30, 31, -70);
        makeMesh(new THREE.ConeGeometry(2, 9, 8), 0xFFDD00, 30, 40, -70);

        // Gilded stupa / chedi in compound
        makeMesh(new THREE.CylinderGeometry(5, 7, 20, 8), 0xFFCC00, 70, 10, -50);
        makeMesh(new THREE.ConeGeometry(5, 15, 8), 0xFFCC00, 70, 27, -50);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 6), 0xFFDD00, 70, 39, -50);

        // Palace courtyard ground
        makeMesh(new THREE.BoxGeometry(190, 0.5, 90), 0xDDCC88, 0, 0.2, -50);

        // Gate structure
        makeMesh(new THREE.BoxGeometry(16, 14, 4), 0xF5EE32, 0, 7, 0);
        makeMesh(new THREE.BoxGeometry(6, 6, 5), 0xFFDD00, 0, 16, 0);
        makeMesh(new THREE.ConeGeometry(3, 8, 6), 0xCC8800, 0, 23, 0);
    }

    // -----------------------------------------------------------------------
    // Wat Arun - Temple of Dawn
    // -----------------------------------------------------------------------
    function buildWatArun() {
        var bx = -180;
        var bz = 50;

        // Riverside terrace base
        makeMesh(new THREE.BoxGeometry(80, 3, 60), 0x888877, bx, 1.5, bz);

        // Central prang base platform (wide stepped base)
        makeMesh(new THREE.BoxGeometry(30, 5, 30), 0x999988, bx, 5, bz);
        makeMesh(new THREE.BoxGeometry(22, 5, 22), 0xAAAA99, bx, 11, bz);

        // Central prang main shaft (79m tall, scaled down)
        makeMesh(new THREE.CylinderGeometry(8, 10, 45, 12), 0x888877, bx, 34, bz);

        // Central prang upper section
        makeMesh(new THREE.CylinderGeometry(5, 8, 15, 10), 0x888877, bx, 64, bz);

        // Central prang spire
        makeMesh(new THREE.CylinderGeometry(1, 5, 12, 8), 0x888877, bx, 77, bz);
        makeMesh(new THREE.ConeGeometry(1.5, 8, 8), 0x888877, bx, 87, bz);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 6), 0xCCBB88, bx, 94, bz);

        // Porcelain mosaic detail rings on central prang (using thin BoxGeometry bands)
        makeMesh(new THREE.BoxGeometry(22, 1.5, 22), 0xBBAA99, bx, 18, bz);
        makeMesh(new THREE.BoxGeometry(20, 1.5, 20), 0xCCBBAA, bx, 28, bz);
        makeMesh(new THREE.BoxGeometry(18, 1.5, 18), 0xBBAA99, bx, 38, bz);
        makeMesh(new THREE.BoxGeometry(16, 1.5, 16), 0xCCBBAA, bx, 48, bz);

        // 4 satellite prangs at corners
        // NW satellite prang
        makeMesh(new THREE.CylinderGeometry(3, 4, 22, 8), 0x888877, bx - 18, 14, bz - 18);
        makeMesh(new THREE.ConeGeometry(3, 8, 8), 0x888877, bx - 18, 29, bz - 18);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), 0xCCBB88, bx - 18, 36, bz - 18);

        // NE satellite prang
        makeMesh(new THREE.CylinderGeometry(3, 4, 22, 8), 0x888877, bx + 18, 14, bz - 18);
        makeMesh(new THREE.ConeGeometry(3, 8, 8), 0x888877, bx + 18, 29, bz - 18);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), 0xCCBB88, bx + 18, 36, bz - 18);

        // SW satellite prang
        makeMesh(new THREE.CylinderGeometry(3, 4, 22, 8), 0x888877, bx - 18, 14, bz + 18);
        makeMesh(new THREE.ConeGeometry(3, 8, 8), 0x888877, bx - 18, 29, bz + 18);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), 0xCCBB88, bx - 18, 36, bz + 18);

        // SE satellite prang
        makeMesh(new THREE.CylinderGeometry(3, 4, 22, 8), 0x888877, bx + 18, 14, bz + 18);
        makeMesh(new THREE.ConeGeometry(3, 8, 8), 0x888877, bx + 18, 29, bz + 18);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), 0xCCBB88, bx + 18, 36, bz + 18);

        // Riverside bank steps
        makeMesh(new THREE.BoxGeometry(80, 2, 8), 0xAAA899, bx, 1, bz + 32);
        makeMesh(new THREE.BoxGeometry(80, 2, 8), 0xBBB9AA, bx, 3, bz + 36);
    }

    // -----------------------------------------------------------------------
    // Baiyoke Tower II - 304m skyscraper
    // -----------------------------------------------------------------------
    function buildBaiyokeTower() {
        var bx = 150;
        var bz = -120;

        // Tower base podium
        makeMesh(new THREE.BoxGeometry(30, 8, 30), 0x336699, bx, 4, bz);
        // Tower lower section
        makeMesh(new THREE.BoxGeometry(22, 80, 22), 0x4488CC, bx, 48, bz);
        // Tower mid section (slight taper)
        makeMesh(new THREE.BoxGeometry(18, 80, 18), 0x5599DD, bx, 130, bz);
        // Tower upper section
        makeMesh(new THREE.BoxGeometry(14, 80, 14), 0x66AAEE, bx, 210, bz);
        // Tower crown
        makeMesh(new THREE.BoxGeometry(10, 30, 10), 0x4488CC, bx, 265, bz);
        // Revolving restaurant ring
        makeMesh(new THREE.CylinderGeometry(12, 12, 6, 12), 0x77BBFF, bx, 283, bz);
        // Antenna mast
        makeMesh(new THREE.CylinderGeometry(0.5, 0.8, 20, 6), 0xCCCCCC, bx, 299, bz);
        // Antenna tip
        makeMesh(new THREE.ConeGeometry(0.5, 5, 6), 0xCCCCCC, bx, 311, bz);

        // Blue glass window strips
        makeMesh(new THREE.BoxGeometry(23, 75, 1), 0x2266AA, bx, 48, bz - 11);
        makeMesh(new THREE.BoxGeometry(23, 75, 1), 0x2266AA, bx, 48, bz + 11);
        makeMesh(new THREE.BoxGeometry(1, 75, 23), 0x2266AA, bx - 11, 48, bz);
        makeMesh(new THREE.BoxGeometry(1, 75, 23), 0x2266AA, bx + 11, 48, bz);
    }

    // -----------------------------------------------------------------------
    // Wat Pho - Temple of the Reclining Buddha
    // -----------------------------------------------------------------------
    function buildWatPho() {
        var bx = 50;
        var bz = 20;

        // Temple complex wall
        makeMesh(new THREE.BoxGeometry(90, 6, 4), 0xD4A850, bx, 3, bz);
        makeMesh(new THREE.BoxGeometry(90, 6, 4), 0xD4A850, bx, 3, bz + 70);
        makeMesh(new THREE.BoxGeometry(4, 6, 70), 0xD4A850, bx - 45, 3, bz + 35);
        makeMesh(new THREE.BoxGeometry(4, 6, 70), 0xD4A850, bx + 45, 3, bz + 35);

        // Reclining Buddha hall - long and low
        makeMesh(new THREE.BoxGeometry(52, 10, 18), 0xD4A850, bx, 5, bz + 35);
        makeMesh(new THREE.BoxGeometry(50, 3, 16), 0xBB8830, bx, 12, bz + 35);
        makeMesh(new THREE.BoxGeometry(46, 3, 12), 0xCC9940, bx, 16, bz + 35);

        // Reclining Buddha itself inside hall (massive gold statue)
        makeMesh(new THREE.BoxGeometry(46, 7, 10), 0xFFCC00, bx, 8.5, bz + 35);
        // Buddha head
        makeMesh(new THREE.SphereGeometry(4, 8, 6), 0xFFCC00, bx + 22, 12, bz + 35);

        // 4 large chedis
        makeMesh(new THREE.CylinderGeometry(5, 7, 25, 8), 0xD4A850, bx - 30, 12, bz + 15);
        makeMesh(new THREE.ConeGeometry(5, 12, 8), 0xCC9933, bx - 30, 31, bz + 15);
        makeMesh(new THREE.CylinderGeometry(5, 7, 25, 8), 0xD4A850, bx + 30, 12, bz + 15);
        makeMesh(new THREE.ConeGeometry(5, 12, 8), 0xCC9933, bx + 30, 31, bz + 15);
        makeMesh(new THREE.CylinderGeometry(5, 7, 25, 8), 0xD4A850, bx - 30, 12, bz + 55);
        makeMesh(new THREE.ConeGeometry(5, 12, 8), 0xCC9933, bx - 30, 31, bz + 55);
        makeMesh(new THREE.CylinderGeometry(5, 7, 25, 8), 0xD4A850, bx + 30, 12, bz + 55);
        makeMesh(new THREE.ConeGeometry(5, 12, 8), 0xCC9933, bx + 30, 31, bz + 55);

        // Courtyard ground
        makeMesh(new THREE.BoxGeometry(82, 0.3, 62), 0xEEDDAA, bx, 0.1, bz + 35);
    }

    // -----------------------------------------------------------------------
    // Chatuchak Weekend Market
    // -----------------------------------------------------------------------
    function buildChatuchakMarket() {
        var bx = -80;
        var bz = -150;

        // Market ground
        makeMesh(new THREE.BoxGeometry(120, 0.5, 80), 0xC8A870, bx, 0.2, bz);

        // Main market hall roofs (large shed structures)
        makeMesh(new THREE.BoxGeometry(50, 8, 35), 0xBB9960, bx - 30, 4, bz - 15);
        makeMesh(new THREE.BoxGeometry(50, 8, 35), 0xCC9955, bx + 30, 4, bz - 15);
        makeMesh(new THREE.BoxGeometry(50, 8, 35), 0xBB9960, bx - 30, 4, bz + 20);
        makeMesh(new THREE.BoxGeometry(50, 8, 35), 0xCC9955, bx + 30, 4, bz + 20);

        // Market stall rows
        makeMesh(new THREE.BoxGeometry(4, 3, 30), 0xDDBB77, bx - 20, 1.5, bz);
        makeMesh(new THREE.BoxGeometry(4, 3, 30), 0xCCAA66, bx - 10, 1.5, bz);
        makeMesh(new THREE.BoxGeometry(4, 3, 30), 0xDDBB77, bx, 1.5, bz);
        makeMesh(new THREE.BoxGeometry(4, 3, 30), 0xCCAA66, bx + 10, 1.5, bz);
        makeMesh(new THREE.BoxGeometry(4, 3, 30), 0xDDBB77, bx + 20, 1.5, bz);

        // Clock tower landmark
        makeMesh(new THREE.BoxGeometry(6, 20, 6), 0x998855, bx + 50, 10, bz - 30);
        makeMesh(new THREE.BoxGeometry(8, 3, 8), 0x887744, bx + 50, 22, bz - 30);
        makeMesh(new THREE.ConeGeometry(4, 6, 6), 0x776633, bx + 50, 27, bz - 30);
    }

    // -----------------------------------------------------------------------
    // Lumphini Park
    // -----------------------------------------------------------------------
    function buildLumphiniPark() {
        var bx = 200;
        var bz = -60;

        // Park ground
        makeMesh(new THREE.BoxGeometry(100, 0.3, 80), 0x4CAF50, bx, 0.1, bz);

        // Lake
        makeMesh(new THREE.BoxGeometry(40, 0.5, 28), 0x2277AA, bx, 0.2, bz);

        // Pedalboat on lake
        makeMesh(new THREE.BoxGeometry(4, 1.5, 2), 0xFF8844, bx - 5, 1, bz - 4);
        makeMesh(new THREE.BoxGeometry(4, 1.5, 2), 0xFFAA22, bx + 8, 1, bz + 6);

        // Trees (cylinders for trunks, spheres for canopy)
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 8, 6), 0x5D3A1A, bx - 35, 4, bz - 25);
        makeMesh(new THREE.SphereGeometry(5, 7, 5), 0x2E7D32, bx - 35, 12, bz - 25);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 8, 6), 0x5D3A1A, bx + 35, 4, bz - 25);
        makeMesh(new THREE.SphereGeometry(5, 7, 5), 0x388E3C, bx + 35, 12, bz - 25);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 8, 6), 0x5D3A1A, bx - 35, 4, bz + 25);
        makeMesh(new THREE.SphereGeometry(5, 7, 5), 0x2E7D32, bx - 35, 12, bz + 25);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 8, 6), 0x5D3A1A, bx + 35, 4, bz + 25);
        makeMesh(new THREE.SphereGeometry(5, 7, 5), 0x388E3C, bx + 35, 12, bz + 25);

        // Jogging path marker pillars
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), 0xFFFFFF, bx - 20, 1.5, bz - 30);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), 0xFFFFFF, bx, 1.5, bz - 30);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), 0xFFFFFF, bx + 20, 1.5, bz - 30);

        // Monitor lizard (elongated box)
        makeMesh(new THREE.BoxGeometry(2.5, 0.5, 0.8), 0x4A5530, bx + 15, 0.4, bz + 10);
    }

    // -----------------------------------------------------------------------
    // MBK / Siam Paragon Shopping Malls
    // -----------------------------------------------------------------------
    function buildMBKSiamParagon() {
        var bx = 120;
        var bz = -180;

        // Siam Paragon main building
        makeMesh(new THREE.BoxGeometry(60, 40, 40), 0x888899, bx, 20, bz);
        // Siam Paragon glass facade
        makeMesh(new THREE.BoxGeometry(61, 38, 2), 0x99AABB, bx, 20, bz - 21);
        makeMesh(new THREE.BoxGeometry(61, 38, 2), 0x99AABB, bx, 20, bz + 21);

        // Tower above mall
        makeMesh(new THREE.BoxGeometry(20, 60, 20), 0xAABBCC, bx, 70, bz);
        makeMesh(new THREE.BoxGeometry(12, 30, 12), 0x8899AA, bx, 115, bz);

        // MBK Center (adjacent)
        makeMesh(new THREE.BoxGeometry(40, 30, 35), 0x777788, bx - 60, 15, bz);
        // Sky train station platform
        makeMesh(new THREE.BoxGeometry(80, 4, 12), 0xAAAAAA, bx - 10, 22, bz - 50);
        // Sky train station pillars
        makeMesh(new THREE.CylinderGeometry(1, 1, 22, 6), 0x999999, bx - 40, 11, bz - 50);
        makeMesh(new THREE.CylinderGeometry(1, 1, 22, 6), 0x999999, bx + 20, 11, bz - 50);

        // Sky train car
        makeMesh(new THREE.BoxGeometry(20, 4, 4), 0xCC4422, bx, 25, bz - 50);
    }

    // -----------------------------------------------------------------------
    // Khao San Road - Backpacker Street
    // -----------------------------------------------------------------------
    function buildKhaoSanRoad() {
        var bx = -100;
        var bz = -80;

        // Street ground
        makeMesh(new THREE.BoxGeometry(80, 0.3, 20), 0xAA9966, bx, 0.1, bz);

        // Guesthouses / shophouses left row
        makeMesh(new THREE.BoxGeometry(10, 12, 10), 0xCCBB99, bx - 30, 6, bz - 8);
        makeMesh(new THREE.BoxGeometry(10, 14, 10), 0xBBAA88, bx - 18, 7, bz - 8);
        makeMesh(new THREE.BoxGeometry(10, 10, 10), 0xCCBB88, bx - 6, 5, bz - 8);
        makeMesh(new THREE.BoxGeometry(10, 12, 10), 0xBBAA77, bx + 6, 6, bz - 8);
        makeMesh(new THREE.BoxGeometry(10, 14, 10), 0xCCBB88, bx + 18, 7, bz - 8);
        makeMesh(new THREE.BoxGeometry(10, 10, 10), 0xBBAA99, bx + 30, 5, bz - 8);

        // Guesthouses / shophouses right row
        makeMesh(new THREE.BoxGeometry(10, 12, 10), 0xCCBB77, bx - 30, 6, bz + 8);
        makeMesh(new THREE.BoxGeometry(10, 14, 10), 0xBBAA88, bx - 18, 7, bz + 8);
        makeMesh(new THREE.BoxGeometry(10, 10, 10), 0xCCBB99, bx - 6, 5, bz + 8);
        makeMesh(new THREE.BoxGeometry(10, 12, 10), 0xBBAA77, bx + 6, 6, bz + 8);

        // Neon sign poles
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 6), 0x444444, bx - 25, 5, bz);
        makeMesh(new THREE.BoxGeometry(5, 1.5, 0.3), 0xFF4422, bx - 25, 10, bz);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 6), 0x444444, bx, 5, bz);
        makeMesh(new THREE.BoxGeometry(5, 1.5, 0.3), 0xFFCC00, bx, 10, bz);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 6), 0x444444, bx + 25, 5, bz);
        makeMesh(new THREE.BoxGeometry(5, 1.5, 0.3), 0xFF2277, bx + 25, 10, bz);

        // Street food cart
        makeMesh(new THREE.BoxGeometry(3, 2, 2), 0xDD9922, bx + 35, 1, bz);
        makeMesh(new THREE.BoxGeometry(4, 0.3, 3), 0xCC8811, bx + 35, 2.2, bz);
    }

    // -----------------------------------------------------------------------
    // Damnoen Saduak Floating Market
    // -----------------------------------------------------------------------
    function buildDamnoenSaduak() {
        var bx = -250;
        var bz = -80;

        // Canal water
        makeMesh(new THREE.BoxGeometry(120, 1, 20), 0x4A7A2A, bx, 0.4, bz);

        // Canal banks (greenery)
        makeMesh(new THREE.BoxGeometry(120, 0.5, 15), 0x3A6A1A, bx, 0.2, bz - 18);
        makeMesh(new THREE.BoxGeometry(120, 0.5, 15), 0x3A6A1A, bx, 0.2, bz + 18);

        // Market boat 1 - fruit laden
        makeMesh(new THREE.BoxGeometry(5, 1.2, 2), 0x885522, bx - 40, 1, bz);
        makeMesh(new THREE.SphereGeometry(1, 5, 4), 0xFF6622, bx - 40, 2.5, bz - 0.5);
        makeMesh(new THREE.SphereGeometry(0.8, 5, 4), 0xFFCC00, bx - 40, 2.5, bz + 0.5);

        // Market boat 2
        makeMesh(new THREE.BoxGeometry(5, 1.2, 2), 0x774411, bx - 20, 1, bz);
        makeMesh(new THREE.SphereGeometry(0.9, 5, 4), 0xFF4400, bx - 20, 2.5, bz);
        makeMesh(new THREE.SphereGeometry(0.8, 5, 4), 0xFFAA00, bx - 20, 2.4, bz + 0.8);

        // Market boat 3
        makeMesh(new THREE.BoxGeometry(5, 1.2, 2), 0x996633, bx, 1, bz);
        makeMesh(new THREE.SphereGeometry(1, 5, 4), 0x33BB44, bx, 2.5, bz);

        // Market boat 4
        makeMesh(new THREE.BoxGeometry(5, 1.2, 2), 0x663311, bx + 20, 1, bz);
        makeMesh(new THREE.SphereGeometry(0.9, 5, 4), 0xFFDD00, bx + 20, 2.4, bz);

        // Market stall huts on bank
        makeMesh(new THREE.BoxGeometry(8, 4, 6), 0xBBAA77, bx - 45, 2, bz - 22);
        makeMesh(new THREE.BoxGeometry(9, 1.5, 7), 0x886633, bx - 45, 5.2, bz - 22);
        makeMesh(new THREE.BoxGeometry(8, 4, 6), 0xCCBB88, bx - 25, 2, bz - 22);
        makeMesh(new THREE.BoxGeometry(9, 1.5, 7), 0x886633, bx - 25, 5.2, bz - 22);

        // Wooden bridge over canal
        makeMesh(new THREE.BoxGeometry(4, 0.5, 24), 0x664422, bx + 40, 1.5, bz);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), 0x553311, bx + 40, 2.5, bz - 10);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), 0x553311, bx + 40, 2.5, bz + 10);
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
