window.IslamabadFaisal = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 24320;
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildFaisalMosque();
        buildPakistanMonument();
        buildDamaneKoh();
        buildRawalLake();
        buildCentaurusMall();
        buildShakarparian();
        buildLokVirsa();
        buildZeroPoint();
        buildPresidency();
        buildMargallaTrails();
    }

    function buildGround() {
        // Ground base platform
        makeBox(2400, 4, 2400, 0x8B7355, 0, -2, 0);
        // Road grid base
        makeBox(2400, 2, 40, 0x555555, 0, 0, -200);
        makeBox(2400, 2, 40, 0x555555, 0, 0, 200);
        makeBox(40, 2, 2400, 0x555555, -300, 0, 0);
        makeBox(40, 2, 2400, 0x555555, 300, 0, 0);
    }

    function buildFaisalMosque() {
        // Faisal Mosque — 0xF5F5F5 — unique tent-shaped shell, no dome
        // Mosque platform / base courtyard
        makeBox(200, 4, 200, 0xE8E8E0, -600, 2, -300);
        // Tent-shaped main prayer hall — wedge approximated with boxes stacked
        makeBox(120, 8, 110, 0xF5F5F5, -600, 6, -300);
        makeBox(100, 16, 90, 0xF5F5F5, -600, 18, -300);
        makeBox(70, 16, 65, 0xF5F5F5, -600, 34, -300);
        makeBox(40, 12, 40, 0xF5F5F5, -600, 50, -300);
        // Tent peak ridge
        makeBox(16, 10, 80, 0xF0F0F0, -600, 64, -300);
        // Side triangular tent faces — approximated with thin boxes at angles
        makeBox(8, 40, 100, 0xF0F0F0, -630, 30, -300);
        makeBox(8, 40, 100, 0xF0F0F0, -570, 30, -300);
        // Four minarets (88m tall each) — at corners of courtyard
        makeCyl(4, 4, 88, 8, 0xF5F5F5, -680, 44, -380);
        makeCyl(4, 4, 88, 8, 0xF5F5F5, -520, 44, -380);
        makeCyl(4, 4, 88, 8, 0xF5F5F5, -680, 44, -220);
        makeCyl(4, 4, 88, 8, 0xF5F5F5, -520, 44, -220);
        // Minaret caps / bulbs
        makeSphere(5, 8, 6, 0xF5F5F5, -680, 92, -380);
        makeSphere(5, 8, 6, 0xF5F5F5, -520, 92, -380);
        makeSphere(5, 8, 6, 0xF5F5F5, -680, 92, -220);
        makeSphere(5, 8, 6, 0xF5F5F5, -520, 92, -220);
        // Minaret finials
        makeCone(3, 12, 8, 0xE8E8E0, -680, 102, -380);
        makeCone(3, 12, 8, 0xE8E8E0, -520, 102, -380);
        makeCone(3, 12, 8, 0xE8E8E0, -680, 102, -220);
        makeCone(3, 12, 8, 0xE8E8E0, -520, 102, -220);
        // Courtyard surrounding walls
        makeBox(200, 6, 4, 0xE0E0D8, -600, 5, -205);
        makeBox(200, 6, 4, 0xE0E0D8, -600, 5, -395);
        makeBox(4, 6, 200, 0xE0E0D8, -705, 5, -300);
        makeBox(4, 6, 200, 0xE0E0D8, -495, 5, -300);
        // Entrance portico
        makeBox(60, 14, 12, 0xF5F5F5, -600, 9, -202);
        makeCyl(3, 3, 14, 6, 0xEEEEEE, -630, 9, -202);
        makeCyl(3, 3, 14, 6, 0xEEEEEE, -600, 9, -202);
        makeCyl(3, 3, 14, 6, 0xEEEEEE, -570, 9, -202);
        // Fountain in courtyard
        makeCyl(16, 20, 3, 12, 0xC8C8C0, -600, 3, -300);
        makeCyl(4, 4, 6, 8, 0xB0B0A8, -600, 6, -300);
        makeSphere(5, 8, 6, 0xADD8E6, -600, 11, -300);
    }

    function buildPakistanMonument() {
        // Pakistan Monument — 0xD4A870 — four petals, marble base, crescent+star
        // Marble base platform
        makeCyl(36, 40, 6, 16, 0xE8D5B0, 100, 3, 100);
        // Central column
        makeCyl(8, 10, 20, 8, 0xD4A870, 100, 13, 100);
        // Four giant petals (wedge-shaped boxes rotated to form flower/star)
        var petals = [
            [0, 0, -30],
            [30, 0, 0],
            [0, 0, 30],
            [-30, 0, 0]
        ];
        for (var pi = 0; pi < petals.length; pi++) {
            var pm = makeBox(22, 30, 22, 0xD4A870, 100 + petals[pi][0], 18, 100 + petals[pi][2]);
            pm.rotation.y = (pi * Math.PI) / 2;
        }
        // Smaller inner petal caps
        makeBox(12, 36, 12, 0xC89A60, 100, 21, -118);
        makeBox(12, 36, 12, 0xC89A60, 118, 21, 100);
        makeBox(12, 36, 12, 0xC89A60, 100, 21, 118);
        makeBox(12, 36, 12, 0xC89A60, -118 + 200, 21, 100);
        // Crescent atop central column
        makeCyl(6, 6, 4, 16, 0xD4A870, 100, 38, 100);
        makeSphere(7, 12, 8, 0xBF9050, 100, 43, 100);
        // Star finial
        makeCone(4, 10, 5, 0xD4C030, 100, 52, 100);
        // Surrounding garden walls
        makeBox(140, 3, 4, 0xC0A868, 100, 3, 140);
        makeBox(140, 3, 4, 0xC0A868, 100, 3, 60);
        makeBox(4, 3, 140, 0xC0A868, 170, 3, 100);
        makeBox(4, 3, 140, 0xC0A868, 30, 3, 100);
        // Decorative pillars
        makeCyl(2, 2, 10, 6, 0xD4B880, 170, 7, 140);
        makeCyl(2, 2, 10, 6, 0xD4B880, 30, 7, 140);
        makeCyl(2, 2, 10, 6, 0xD4B880, 170, 7, 60);
        makeCyl(2, 2, 10, 6, 0xD4B880, 30, 7, 60);
    }

    function buildDamaneKoh() {
        // Daman-e-Koh — 0x4CAF50 — hilltop viewpoint in Margalla Hills
        // Hill mass
        makeCyl(100, 140, 80, 12, 0x5A7A3A, -400, 40, 500);
        makeCyl(70, 100, 40, 12, 0x4CAF50, -400, 80, 500);
        makeCyl(40, 70, 30, 10, 0x55B555, -400, 110, 500);
        // Viewing platform at top
        makeBox(60, 5, 60, 0xCCBBA0, -400, 128, 500);
        // Railing / wall around platform
        makeBox(60, 4, 3, 0xBBAA90, -400, 131, 530);
        makeBox(60, 4, 3, 0xBBAA90, -400, 131, 470);
        makeBox(3, 4, 60, 0xBBAA90, -370, 131, 500);
        makeBox(3, 4, 60, 0xBBAA90, -430, 131, 500);
        // Info kiosk on platform
        makeBox(10, 8, 10, 0xD4C8A0, -395, 134, 495);
        makeCone(7, 6, 4, 0x8B4513, -395, 141, 495);
        // Forest trees on hillside (cones + cylinders)
        makeCyl(2, 2, 12, 6, 0x5C3A1E, -420, 82, 530);
        makeCone(8, 16, 6, 0x2E7D32, -420, 96, 530);
        makeCyl(2, 2, 12, 6, 0x5C3A1E, -360, 82, 520);
        makeCone(8, 16, 6, 0x388E3C, -360, 96, 520);
        makeCyl(2, 2, 12, 6, 0x5C3A1E, -440, 82, 480);
        makeCone(8, 16, 6, 0x1B5E20, -440, 96, 480);
        makeCyl(2, 2, 10, 6, 0x5C3A1E, -380, 92, 515);
        makeCone(7, 14, 6, 0x4CAF50, -380, 103, 515);
        // Winding path up the hill
        makeBox(8, 2, 60, 0xAA9977, -400, 82, 460);
        makeBox(60, 2, 8, 0xAA9977, -430, 62, 500);
    }

    function buildRawalLake() {
        // Rawal Lake — 0x2A5A8A — reservoir east of city
        // Lake body
        makeCyl(140, 150, 4, 16, 0x2A5A8A, 600, 1, 300);
        // Shoreline / embankment
        makeCyl(155, 160, 3, 16, 0x8B7355, 600, 0, 300);
        // Bridge across the lake
        makeBox(300, 6, 14, 0x888888, 600, 5, 300);
        // Bridge pylons
        makeCyl(4, 4, 12, 6, 0x777777, 550, 3, 300);
        makeCyl(4, 4, 12, 6, 0x777777, 620, 3, 300);
        makeCyl(4, 4, 12, 6, 0x777777, 680, 3, 300);
        // Boating dock
        makeBox(30, 3, 10, 0x8B6914, 580, 4, 420);
        makeBox(6, 3, 40, 0x8B6914, 570, 4, 430);
        // Small boat approximations
        makeBox(10, 3, 5, 0xCC4444, 595, 5, 415);
        makeBox(10, 3, 5, 0x4444CC, 610, 5, 415);
        // Lakeside trees
        makeCyl(2, 2, 14, 6, 0x4A3020, 470, 9, 260);
        makeCone(9, 18, 6, 0x2E7D32, 470, 23, 260);
        makeCyl(2, 2, 14, 6, 0x4A3020, 490, 9, 420);
        makeCone(9, 18, 6, 0x388E3C, 490, 23, 420);
        makeCyl(2, 2, 14, 6, 0x4A3020, 720, 9, 340);
        makeCone(9, 18, 6, 0x1B5E20, 720, 23, 340);
        // Picnic area / rest shelter
        makeBox(20, 3, 20, 0xCCBB99, 470, 3, 380);
        makeBox(24, 2, 24, 0x8B6914, 470, 7, 380);
        makeCyl(2, 2, 7, 4, 0x7B5914, 458, 5, 368);
        makeCyl(2, 2, 7, 4, 0x7B5914, 482, 5, 368);
        makeCyl(2, 2, 7, 4, 0x7B5914, 458, 5, 392);
        makeCyl(2, 2, 7, 4, 0x7B5914, 482, 5, 392);
    }

    function buildCentaurusMall() {
        // Centaurus Mall — 0x888899 — three towers of glass
        // Base podium / mall base
        makeBox(180, 18, 120, 0x9999AA, 200, 9, -100);
        // Tower 1 (tallest, center)
        makeBox(40, 130, 40, 0x888899, 200, 74, -100);
        // Tower 2 (left)
        makeBox(30, 100, 30, 0x8888A0, 160, 59, -100);
        // Tower 3 (right)
        makeBox(30, 100, 30, 0x8888A0, 240, 59, -100);
        // Tower top features
        makeCyl(10, 14, 20, 8, 0x777788, 200, 145, -100);
        makeCone(8, 18, 8, 0x666677, 200, 164, -100);
        // Side tower caps
        makeBox(22, 8, 22, 0x999AAA, 160, 108, -100);
        makeBox(22, 8, 22, 0x999AAA, 240, 108, -100);
        // Entrance canopy
        makeBox(80, 6, 20, 0xAAAABB, 200, 21, -42);
        makeCyl(3, 3, 20, 6, 0x888899, 160, 12, -42);
        makeCyl(3, 3, 20, 6, 0x888899, 200, 12, -42);
        makeCyl(3, 3, 20, 6, 0x888899, 240, 12, -42);
        // Parking structure beside mall
        makeBox(80, 18, 50, 0x777788, 310, 9, -100);
        makeBox(80, 2, 50, 0x888899, 310, 19, -100);
        makeBox(80, 2, 50, 0x888899, 310, 28, -100);
        // Billboard / signage
        makeBox(40, 10, 2, 0xCCCCDD, 200, 28, -38);
    }

    function buildShakarparian() {
        // Shakarparian Hills — 0x5D8A5D — park, Rose & Jasmine Garden, flagpole
        // Hill mass
        makeCyl(90, 120, 60, 12, 0x4A7040, -200, 30, 600);
        makeCyl(60, 90, 30, 10, 0x5D8A5D, -200, 60, 600);
        // Rose & Jasmine Garden base
        makeBox(80, 3, 80, 0x6A9A5A, -200, 32, 600);
        // Flower bed boxes (coloured)
        makeBox(15, 2, 15, 0xE83040, -215, 35, 585);
        makeBox(15, 2, 15, 0xFFD700, -185, 35, 585);
        makeBox(15, 2, 15, 0xFF69B4, -215, 35, 615);
        makeBox(15, 2, 15, 0xFFFFFF, -185, 35, 615);
        // Central garden fountain
        makeCyl(10, 12, 3, 10, 0xC8C8C0, -200, 34, 600);
        makeCyl(3, 3, 6, 8, 0xB0B0A8, -200, 37, 600);
        // Flagpole — world's tallest in Pakistan
        makeCyl(2, 3, 120, 6, 0xCCCCCC, -200, 92, 600);
        // Flag (box)
        makeBox(30, 20, 2, 0x01411C, -182, 148, 600);
        makeBox(8, 20, 2, 0xFFFFFF, -200, 148, 600);
        // Viewing benches / seats
        makeBox(20, 3, 5, 0xAA8844, -230, 34, 600);
        makeBox(20, 3, 5, 0xAA8844, -170, 34, 600);
        // Trees along hillside
        makeCyl(2, 2, 14, 6, 0x4A3020, -170, 34, 560);
        makeCone(9, 18, 6, 0x4CAF50, -170, 48, 560);
        makeCyl(2, 2, 14, 6, 0x4A3020, -240, 34, 640);
        makeCone(9, 18, 6, 0x388E3C, -240, 48, 640);
        makeCyl(2, 2, 14, 6, 0x4A3020, -150, 38, 620);
        makeCone(9, 18, 6, 0x2E7D32, -150, 52, 620);
        // Footpath winding up
        makeBox(8, 2, 80, 0xBBAA88, -200, 32, 548);
    }

    function buildLokVirsa() {
        // Lok Virsa Museum — 0xD4C8B0 — folk heritage museum, traditional architecture
        // Main building base
        makeBox(80, 12, 60, 0xD4C8B0, 400, 6, 500);
        // Traditional arched roof structure
        makeCyl(18, 22, 16, 8, 0xC8BC9C, 400, 20, 500);
        makeSphere(18, 10, 8, 0xC0B490, 400, 32, 500);
        // Side wings
        makeBox(30, 10, 30, 0xD4C8B0, 360, 5, 500);
        makeBox(30, 10, 30, 0xD4C8B0, 440, 5, 500);
        // Small domes on wings
        makeSphere(10, 8, 6, 0xC8BC9C, 360, 16, 500);
        makeSphere(10, 8, 6, 0xC8BC9C, 440, 16, 500);
        // Traditional entrance gateway (arch)
        makeBox(24, 18, 6, 0xD4C8B0, 400, 9, 470);
        makeBox(8, 18, 6, 0xD4C8B0, 388, 9, 470);
        makeBox(8, 18, 6, 0xD4C8B0, 412, 9, 470);
        makeSphere(14, 8, 6, 0xC8BC9C, 400, 21, 470);
        // Courtyard
        makeBox(60, 2, 40, 0xC0B490, 400, 13, 500);
        // Decorative pillars at entrance
        makeCyl(2, 2, 18, 8, 0xD4C8B0, 390, 9, 470);
        makeCyl(2, 2, 18, 8, 0xD4C8B0, 410, 9, 470);
        // Craft exhibit pavilion
        makeBox(24, 8, 24, 0xD4C8B0, 450, 4, 520);
        makeCone(14, 10, 4, 0xC0A870, 450, 13, 520);
        // Trees in museum grounds
        makeCyl(2, 2, 12, 6, 0x4A3020, 370, 8, 530);
        makeCone(8, 14, 6, 0x388E3C, 370, 21, 530);
        makeCyl(2, 2, 12, 6, 0x4A3020, 430, 8, 530);
        makeCone(8, 14, 6, 0x2E7D32, 430, 21, 530);
    }

    function buildZeroPoint() {
        // Zero Point Interchange — 0x888888 — major highway interchange, overpasses
        // Ground level road base
        makeBox(200, 4, 40, 0x555555, 0, 2, 0);
        makeBox(40, 4, 200, 0x555555, 0, 2, 0);
        // Elevated first level overpasses
        makeBox(180, 6, 20, 0x888888, 0, 16, 0);
        makeBox(20, 6, 180, 0x888888, 0, 16, 0);
        // Second level cloverleaf curves — approximated as boxes
        makeBox(60, 6, 20, 0x888888, -90, 16, -50);
        makeBox(60, 6, 20, 0x888888, 90, 16, 50);
        makeBox(20, 6, 60, 0x888888, 50, 16, -90);
        makeBox(20, 6, 60, 0x888888, -50, 16, 90);
        // Support pillars under overpass
        makeBox(6, 14, 6, 0x888888, -60, 9, 0);
        makeBox(6, 14, 6, 0x888888, 60, 9, 0);
        makeBox(6, 14, 6, 0x888888, 0, 9, -60);
        makeBox(6, 14, 6, 0x888888, 0, 9, 60);
        // Traffic light poles
        makeCyl(1, 1, 14, 4, 0x444444, -30, 9, -30);
        makeCyl(1, 1, 14, 4, 0x444444, 30, 9, 30);
        makeBox(10, 2, 2, 0x333333, -25, 16, -30);
        makeBox(10, 2, 2, 0x333333, 25, 16, 30);
        // Road markings
        makeBox(4, 1, 160, 0xFFFF00, -2, 4, 0);
        makeBox(160, 1, 4, 0xFFFF00, 0, 4, -2);
    }

    function buildPresidency() {
        // Presidency / PM House — 0xCCCCBB — white colonnaded buildings, security walls
        // Main government building
        makeBox(120, 20, 70, 0xCCCCBB, -100, 10, -550);
        // Portico / colonnade front
        makeBox(80, 22, 12, 0xDDDDCC, -100, 11, -515);
        // Columns
        makeCyl(3, 3, 22, 8, 0xEEEEDD, -140, 11, -515);
        makeCyl(3, 3, 22, 8, 0xEEEEDD, -120, 11, -515);
        makeCyl(3, 3, 22, 8, 0xEEEEDD, -100, 11, -515);
        makeCyl(3, 3, 22, 8, 0xEEEEDD, -80, 11, -515);
        makeCyl(3, 3, 22, 8, 0xEEEEDD, -60, 11, -515);
        // Central dome
        makeCyl(18, 20, 10, 12, 0xCCCCBB, -100, 25, -550);
        makeSphere(18, 12, 8, 0xDDDDCC, -100, 33, -550);
        // Side wings of complex
        makeBox(50, 14, 40, 0xCCCCBB, -180, 7, -550);
        makeBox(50, 14, 40, 0xCCCCBB, -20, 7, -550);
        // Security perimeter walls
        makeBox(300, 8, 4, 0xBBBBAA, -100, 4, -490);
        makeBox(300, 8, 4, 0xBBBBAA, -100, 4, -630);
        makeBox(4, 8, 150, 0xBBBBAA, -250, 4, -560);
        makeBox(4, 8, 150, 0xBBBBAA, 50, 4, -560);
        // Guard posts at gate
        makeBox(10, 12, 10, 0xCCCCBB, -120, 6, -490);
        makeBox(10, 12, 10, 0xCCCCBB, -80, 6, -490);
        // Flagpole at front
        makeCyl(2, 2, 28, 6, 0xCCCCCC, -100, 16, -495);
        makeBox(18, 12, 2, 0x01411C, -90, 34, -495);
        // Lawn / driveway
        makeBox(80, 2, 40, 0x4A8A3A, -100, 2, -510);
        makeBox(10, 2, 40, 0x888888, -100, 2, -505);
    }

    function buildMargallaTrails() {
        // Trail 3 / Trail 5 — 0x6B8C42 — hiking trails through Margalla Hills
        // Main hill ridge
        makeBox(500, 60, 80, 0x4A6030, -300, 30, 700);
        makeBox(400, 90, 80, 0x3D5028, -200, 45, 780);
        makeBox(300, 110, 80, 0x4A6030, 0, 55, 820);
        // Trail 3 path (series of boxes along hill slope)
        makeBox(8, 2, 60, 0xAA9977, -350, 34, 660);
        makeBox(60, 2, 8, 0xAA9977, -310, 44, 680);
        makeBox(8, 2, 60, 0xAA9977, -260, 54, 700);
        makeBox(60, 2, 8, 0xAA9977, -220, 62, 720);
        // Trail 5 path
        makeBox(8, 2, 60, 0xAA9977, -100, 44, 740);
        makeBox(60, 2, 8, 0xAA9977, -60, 54, 760);
        makeBox(8, 2, 60, 0xAA9977, -20, 64, 780);
        // Forest along trails
        makeCyl(2, 2, 16, 6, 0x3E2010, -330, 38, 660);
        makeCone(10, 20, 6, 0x4CAF50, -330, 54, 660);
        makeCyl(2, 2, 16, 6, 0x3E2010, -280, 48, 690);
        makeCone(10, 20, 6, 0x388E3C, -280, 64, 690);
        makeCyl(2, 2, 16, 6, 0x3E2010, -230, 54, 710);
        makeCone(10, 20, 6, 0x2E7D32, -230, 70, 710);
        makeCyl(2, 2, 16, 6, 0x3E2010, -130, 44, 745);
        makeCone(10, 20, 6, 0x4CAF50, -130, 60, 745);
        makeCyl(2, 2, 16, 6, 0x3E2010, -70, 54, 770);
        makeCone(10, 20, 6, 0x388E3C, -70, 70, 770);
        // Trail markers / rest points
        makeBox(4, 8, 4, 0xCCBBAA, -300, 42, 680);
        makeBox(4, 8, 4, 0xCCBBAA, -150, 52, 750);
        // Stream / nullah along hill base
        makeBox(400, 2, 12, 0x2A5A8A, -200, 2, 640);
        // Rocky outcrop shapes
        makeBox(24, 18, 24, 0x6B6A5A, -350, 11, 720);
        makeBox(16, 12, 16, 0x7A796A, -340, 17, 710);
        makeBox(20, 14, 20, 0x6B6A5A, 80, 66, 800);
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
