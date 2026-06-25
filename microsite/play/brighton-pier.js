window.BrightonPier = (function() {
    'use strict';

    var WX = 4120;
    var WZ = 2200;

    var sceneRef = null;
    var objects = [];
    var i360pod = null;
    var i360podY = 2;
    var i360podDir = 1;
    var volksTrainCars = [];
    var volksTrainX = 0;
    var time = 0;

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        sceneRef.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        sceneRef.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        sceneRef.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        sceneRef.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    // Feature 5: Brighton beach — pebble ground
    function buildbeach() {
        makebox(80, 0.5, 30, 0x9E9E9E, 0, 0.25, 10);
        // Pebble texture suggestion — scattered small boxes
        var pebblepos = [
            [-30, 5], [-20, 8], [-10, 12], [0, 6], [10, 9], [20, 14], [30, 4],
            [-25, 18], [-15, 3], [5, 20], [15, 7], [25, 16], [-35, 11], [35, 13]
        ];
        for (var i = 0; i < pebblepos.length; i++) {
            makebox(1, 0.2, 0.8, 0x8A8A8A, pebblepos[i][0], 0.6, pebblepos[i][1]);
        }
    }

    // Feature 6: English Channel — blue water south of pier
    function buildchannel() {
        makebox(200, 0.4, 80, 0x1E90FF, 0, 0.2, -50);
        // Wave suggestion strips
        makebox(200, 0.15, 1, 0x4AACFF, 0, 0.45, -20);
        makebox(200, 0.15, 1, 0x4AACFF, 0, 0.45, -35);
        makebox(200, 0.15, 1, 0x4AACFF, 0, 0.45, -55);
        makebox(200, 0.15, 1, 0x4AACFF, 0, 0.45, -70);
    }

    // Feature 1: Palace Pier
    function buildpalacepier() {
        // Pier deck — 55 blocks into sea going south (negative Z)
        makebox(12, 1, 55, 0x8B4513, 20, 1.5, -27);
        // Support columns every 5 blocks along length
        var colz = [-5, -10, -15, -20, -25, -30, -35, -40, -45, -50];
        for (var i = 0; i < colz.length; i++) {
            makebox(1.2, 3, 1.2, 0x6B3410, 15, -0.5, colz[i]);
            makebox(1.2, 3, 1.2, 0x6B3410, 25, -0.5, colz[i]);
            makebox(1.2, 3, 1.2, 0x6B3410, 20, -0.5, colz[i]);
        }
        // Cross-bracing suggestion
        for (var j = 0; j < colz.length; j++) {
            makebox(12, 0.5, 0.5, 0x7A3C12, 20, 0.5, colz[j]);
        }
        // Pier entrance arch building
        makebox(14, 6, 5, 0x8B4513, 20, 4, 3);
        makebox(14, 1, 5, 0xCC2200, 20, 7.5, 3);
        // Pier entrance turrets
        makecylinder(1.5, 1.5, 8, 10, 0x8B4513, 14, 4, 3);
        makecylinder(1.5, 1.5, 8, 10, 0x8B4513, 26, 4, 3);
        makecone(2, 3, 10, 0xCC2200, 14, 9, 3);
        makecone(2, 3, 10, 0xCC2200, 26, 9, 3);
        // Amusement building at end of pier
        makebox(14, 8, 12, 0xD2691E, 20, 5, -50);
        makebox(14, 2, 12, 0xCC0000, 20, 9.5, -50);
        // Funfair dome on building
        makecylinder(3, 3, 2, 12, 0xCC0000, 20, 11.5, -50);
        makesphere(3, 10, 8, 0xCC0000, 20, 13, -50);
        // Fairground windows
        makebox(2, 2, 0.3, 0xFFDD88, 15, 5, -44.5);
        makebox(2, 2, 0.3, 0xFFDD88, 20, 5, -44.5);
        makebox(2, 2, 0.3, 0xFFDD88, 25, 5, -44.5);
        // Pier railing
        makebox(0.3, 1.5, 55, 0xA0522D, 14, 2.5, -27);
        makebox(0.3, 1.5, 55, 0xA0522D, 26, 2.5, -27);
        // Flagpole at pier end
        makecylinder(0.2, 0.2, 6, 6, 0xAAAAAA, 20, 6, -54);
        makebox(2.5, 1, 0.1, 0x0000CC, 21.25, 10, -54);
    }

    // Feature 7: West Pier ruins — derelict partially collapsed
    function buildwestpier() {
        // Pier stub on shore
        makebox(8, 1, 15, 0x8B4513, -40, 1.5, -7);
        // Ruined columns leaning/broken
        makebox(1.2, 2, 1.2, 0x7A3C12, -38, 0.5, -5);
        makebox(1.2, 1.5, 1.2, 0x7A3C12, -42, 0.5, -10);
        makebox(1.2, 2.5, 1.2, 0x7A3C12, -38, 0.5, -15);
        // Main broken deck sections
        makebox(8, 0.8, 10, 0x8B4513, -40, 1.2, -18);
        makebox(6, 0.8, 8, 0x8B4513, -39, 0.8, -30);
        // Rusty iron skeleton
        makebox(0.4, 4, 0.4, 0x8B4513, -37, 2, -22);
        makebox(0.4, 3, 0.4, 0x8B4513, -43, 1.5, -24);
        // Concert hall ruin box — partially standing
        makebox(10, 5, 10, 0x6B3410, -40, 3, -40);
        // Collapsed roof section
        makebox(12, 1, 8, 0x5A2D0C, -40, 5, -40);
        // Iron struts sticking out
        makebox(0.3, 0.3, 6, 0x8B4513, -35, 4, -40);
        makebox(0.3, 0.3, 6, 0x8B4513, -45, 3.5, -40);
        // Broken section in water
        makebox(5, 0.6, 4, 0x6B3410, -38, 0.6, -50);
        makebox(3, 0.4, 3, 0x6B3410, -42, 0.4, -58);
    }

    // Feature 2: Royal Pavilion
    function buildpavillion() {
        // Main body — cream/white
        makebox(18, 10, 8, 0xFFF8DC, -20, 6, 40);
        // Upper storey
        makebox(16, 4, 7, 0xFFF8DC, -20, 13, 40);
        // Central large onion dome on cylinder base
        makecylinder(2.5, 2.5, 6, 12, 0xFFF8DC, -20, 19, 40);
        makecylinder(4, 2.5, 3, 12, 0xFFF8DC, -20, 24, 40);
        makecylinder(4, 0.5, 4, 12, 0xFFF8DC, -20, 27.5, 40);
        makecone(0.8, 5, 12, 0xFFF8DC, -20, 32, 40);
        // Four corner onion domes
        var corners = [
            [-28, 35], [-12, 35], [-28, 45], [-12, 45]
        ];
        for (var i = 0; i < corners.length; i++) {
            makecylinder(1.2, 1.2, 4, 10, 0xFFF8DC, corners[i][0], 13, corners[i][1]);
            makecylinder(2, 1.2, 2, 10, 0xFFF8DC, corners[i][0], 17, corners[i][1]);
            makecylinder(2, 0.3, 2, 10, 0xFFF8DC, corners[i][0], 19.5, corners[i][1]);
            makecone(0.4, 3, 10, 0xFFF8DC, corners[i][0], 22, corners[i][1]);
        }
        // Ornate finials along roofline
        var finialx = [-27, -24, -21, -18, -15, -13];
        for (var f = 0; f < finialx.length; f++) {
            makebox(0.5, 2, 0.5, 0xFFF8DC, finialx[f], 17, 36.5);
            makebox(0.5, 2, 0.5, 0xFFF8DC, finialx[f], 17, 43.5);
            makecone(0.4, 1, 6, 0xFFF8DC, finialx[f], 19, 36.5);
            makecone(0.4, 1, 6, 0xFFF8DC, finialx[f], 19, 43.5);
        }
        // Decorative arched entrance suggestion
        makebox(4, 6, 1, 0xEEE8C8, -20, 5, 44.5);
        makebox(2, 4, 0.2, 0xCCBB88, -20, 4.5, 45);
        // North and South wings
        makebox(6, 7, 6, 0xFFF8DC, -28, 4.5, 40);
        makebox(6, 7, 6, 0xFFF8DC, -12, 4.5, 40);
        // Wing domes
        makecylinder(1.5, 1.5, 3, 10, 0xFFF8DC, -28, 10, 40);
        makecylinder(2.5, 1.5, 2, 10, 0xFFF8DC, -28, 12.5, 40);
        makecylinder(2.5, 0.3, 1.5, 10, 0xFFF8DC, -28, 14, 40);
        makecone(0.5, 3, 10, 0xFFF8DC, -28, 16, 40);
        makecylinder(1.5, 1.5, 3, 10, 0xFFF8DC, -12, 10, 40);
        makecylinder(2.5, 1.5, 2, 10, 0xFFF8DC, -12, 12.5, 40);
        makecylinder(2.5, 0.3, 1.5, 10, 0xFFF8DC, -12, 14, 40);
        makecone(0.5, 3, 10, 0xFFF8DC, -12, 16, 40);
        // Pavilion grounds lawn suggestion
        makebox(30, 0.3, 20, 0x2E7D32, -20, 0.15, 40);
        // Ornamental gate posts
        makecylinder(0.5, 0.5, 4, 8, 0xFFF8DC, -10, 2, 50);
        makecylinder(0.5, 0.5, 4, 8, 0xFFF8DC, -30, 2, 50);
        makesphere(0.7, 8, 6, 0xFFF8DC, -10, 4.5, 50);
        makesphere(0.7, 8, 6, 0xFFF8DC, -30, 4.5, 50);
    }

    // Feature 3: Brighton i360 observation tower
    function buildi360() {
        // Tall thin column
        makecylinder(1.5, 1.5, 30, 12, 0xBBBBBB, 55, 16, 20);
        // Column base
        makebox(5, 2, 5, 0xAAAAAA, 55, 1, 20);
        makecylinder(2.5, 2.5, 1, 10, 0x999999, 55, 2.5, 20);
        // Observation pod — animated, stored for update()
        var pod = makebox(8, 4, 8, 0xCCCCCC, 55, i360podY + 2, 20);
        i360pod = pod;
        // Pod detail band
        makebox(8.2, 1, 8.2, 0x888888, 55, i360podY + 2, 20);
        // Column top cap
        makecylinder(1.8, 1.5, 2, 12, 0xAAAAAA, 55, 32, 20);
        makesphere(1.5, 10, 8, 0xCCCCCC, 55, 34, 20);
    }

    // Feature 4: The Lanes — historic shopping area
    function buildlanes() {
        // Cluster of small flint-faced buildings
        var lanebuildings = [
            [70, 6, 60, 6, 5, 8],
            [78, 4, 62, 5, 7, 6],
            [75, 6, 70, 7, 6, 7],
            [69, 8, 68, 6, 4, 5],
            [83, 4, 65, 5, 6, 9],
            [80, 5, 74, 6, 5, 6],
            [72, 7, 74, 5, 7, 7],
            [86, 6, 70, 5, 5, 8],
            [67, 5, 62, 4, 8, 6],
            [90, 4, 60, 5, 5, 7]
        ];
        for (var i = 0; i < lanebuildings.length; i++) {
            var b = lanebuildings[i];
            makebox(b[2], b[3], b[4], 0x696969, b[0], b[3] / 2, b[1]);
            // Roof
            makebox(b[2] + 0.5, 0.5, b[4] + 0.5, 0x555555, b[0], b[3] + 0.25, b[1]);
            // Chimney
            makecylinder(0.3, 0.3, 2, 6, 0x555555, b[0] - 1, b[3] + 1.5, b[1] - 1);
        }
        // Narrow alley gaps are implied by building placement spacing
        // Alley ground
        makebox(25, 0.2, 20, 0x5A5A5A, 78, 0.1, 66);
        // Shop window suggestion strips
        makebox(2, 1.5, 0.2, 0x88AACC, 70, 2, 55.5);
        makebox(2, 1.5, 0.2, 0x88AACC, 75, 2, 55.5);
        makebox(2, 1.5, 0.2, 0x88AACC, 80, 2, 55.5);
        // Signs
        makebox(3, 0.8, 0.2, 0xCC6622, 72, 4, 55.5);
        makebox(3, 0.8, 0.2, 0xCC6622, 80, 4, 55.5);
    }

    // Feature 8: Brighton Station — Victorian Gothic terminus
    function buildstation() {
        // Main train shed box — large
        makebox(30, 12, 20, 0x8B7355, -60, 7, 70);
        // Arched roof suggestion — raised centre box
        makebox(22, 4, 20, 0x7A6345, -60, 17, 70);
        makebox(14, 3, 20, 0x6A5335, -60, 22, 70);
        // Clock tower — Victorian Gothic
        makebox(6, 20, 6, 0x8B7355, -50, 12, 60);
        makbox_finial(-50, 23, 60);
        // Arched entrance
        makebox(10, 8, 2, 0x7A6345, -60, 5, 80);
        makebox(8, 6, 0.3, 0x3A2A1A, -60, 4.5, 81);
        // Platform canopies
        makebox(30, 1, 6, 0x8A7A6A, -60, 14, 65);
        makebox(30, 1, 6, 0x8A7A6A, -60, 14, 72);
        // Station wall north face
        makebox(30, 12, 2, 0x8B7355, -60, 7, 80);
        // Victorian ironwork columns suggestion
        makecylinder(0.4, 0.4, 14, 8, 0x555555, -45, 7, 60);
        makecylinder(0.4, 0.4, 14, 8, 0x555555, -75, 7, 60);
        makecylinder(0.4, 0.4, 14, 8, 0x555555, -45, 7, 80);
        makecylinder(0.4, 0.4, 14, 8, 0x555555, -75, 7, 80);
        // Station grounds
        makebox(35, 0.2, 25, 0x666666, -60, 0.1, 70);
        // Railway tracks (flat box strips)
        makebox(1, 0.1, 20, 0x333333, -57, 0.2, 70);
        makebox(1, 0.1, 20, 0x333333, -63, 0.2, 70);
    }

    // Helper: clock tower finial for station
    function makbox_finial(x, y, z) {
        makebox(7, 1, 7, 0x7A6345, x, y, z);
        makecone(3, 6, 8, 0x5A4325, x, y + 4, z);
        makebox(0.4, 3, 0.4, 0xAAAA88, x, y + 8, z);
        makesphere(0.6, 8, 6, 0xAAAA88, x, y + 10, z);
    }

    // Feature 9: Sea Life Centre
    function buildsealife() {
        // Main aquarium building
        makebox(20, 8, 14, 0x008080, 45, 5, 15);
        // Upper section dome-ish
        makebox(18, 3, 12, 0x006666, 45, 10, 15);
        makecylinder(5, 5, 3, 12, 0x007070, 45, 13, 15);
        makecylinder(5, 0.5, 2, 12, 0x007070, 45, 15.5, 15);
        // Underwater tunnel entrance
        makebox(4, 5, 5, 0x005555, 35, 3.5, 15);
        makesphere(2, 10, 8, 0x004444, 35, 5.5, 15);
        // Sign
        makebox(8, 1.5, 0.3, 0x00AAAA, 45, 9.5, 8);
        // Windows — blue-green panes
        var winx = [38, 41, 44, 47, 50, 53];
        for (var i = 0; i < winx.length; i++) {
            makebox(1.8, 2, 0.2, 0x00CCCC, winx[i], 4, 8.1);
        }
        // Shark statue outside
        makebox(3, 1.5, 6, 0x4488AA, 35, 1.5, 10);
        makecone(1, 2, 4, 0x4488AA, 35, 3, 10);
    }

    // Feature 10: Volks Electric Railway
    function buildvolks() {
        // Track along beach front
        makebox(80, 0.3, 1.5, 0x8B7355, 0, 0.4, 18);
        // Rail lines
        makebox(80, 0.2, 0.3, 0x555555, 0, 0.55, 17.2);
        makebox(80, 0.2, 0.3, 0x555555, 0, 0.55, 18.8);
        // Tie sleepers
        var sleeperx = [-35, -25, -15, -5, 5, 15, 25, 35];
        for (var i = 0; i < sleeperx.length; i++) {
            makebox(0.5, 0.25, 2.5, 0x5A3A1A, sleeperx[i], 0.42, 18);
        }
        // Train cars — animated in update()
        var car1 = makebox(4, 2.5, 3, 0xDDCC00, -30, 1.75, 18);
        var car2 = makebox(4, 2.5, 3, 0xDDCC00, -35, 1.75, 18);
        var car1roof = makebox(4.2, 0.5, 3.2, 0xCC9900, -30, 3.25, 18);
        var car2roof = makebox(4.2, 0.5, 3.2, 0xCC9900, -35, 3.25, 18);
        // Wheels
        makecylinder(0.5, 0.5, 0.4, 8, 0x333333, -28.5, 0.7, 17.2);
        makecylinder(0.5, 0.5, 0.4, 8, 0x333333, -31.5, 0.7, 17.2);
        makecylinder(0.5, 0.5, 0.4, 8, 0x333333, -28.5, 0.7, 18.8);
        makecylinder(0.5, 0.5, 0.4, 8, 0x333333, -31.5, 0.7, 18.8);
        // Windows on cars
        makebox(1, 1, 0.2, 0x88BBDD, -29.5, 2.2, 16.9);
        makebox(1, 1, 0.2, 0x88BBDD, -30.5, 2.2, 16.9);
        volksTrainCars = [car1, car2, car1roof, car2roof];
        volksTrainX = -30;
        // Station stop shelter on beach
        makebox(5, 3, 3, 0xAA9966, -40, 1.8, 18);
        makebox(5.5, 0.5, 3.5, 0x997755, -40, 3.25, 18);
        // Seafront promenade
        makebox(80, 0.2, 5, 0xBBAA88, 0, 0.35, 22);
    }

    // Seafront road and promenade details
    function buildpromenade() {
        makebox(80, 0.3, 4, 0x888888, 0, 0.35, 28);
        // Lamp posts along promenade
        var lampx = [-35, -20, -5, 10, 25, 40];
        for (var i = 0; i < lampx.length; i++) {
            makecylinder(0.2, 0.2, 5, 8, 0x888888, lampx[i], 2.7, 25);
            makesphere(0.5, 8, 6, 0xFFFFCC, lampx[i], 5.6, 25);
        }
        // Seafront benches (small flat boxes)
        var benchx = [-30, -10, 10, 30];
        for (var j = 0; j < benchx.length; j++) {
            makebox(2.5, 0.3, 0.8, 0x8B6914, benchx[j], 0.65, 26);
            makebox(0.2, 1, 0.8, 0x8B6914, benchx[j] - 1, 1, 26);
            makebox(0.2, 1, 0.8, 0x8B6914, benchx[j] + 1, 1, 26);
        }
    }

    // Surrounding Brighton townscape filler
    function buildtownscape() {
        // Row of seafront hotels
        var hoteldata = [
            [-80, 50, 12, 14, 8],
            [-65, 50, 10, 12, 8],
            [-55, 55, 9, 10, 7],
            [70, 50, 10, 12, 8],
            [82, 50, 11, 13, 9]
        ];
        for (var i = 0; i < hoteldata.length; i++) {
            var h = hoteldata[i];
            makebox(h[2], h[3], h[4], 0xEEDDCC, h[0], h[3] / 2, h[1]);
            makebox(h[2] + 0.5, 0.5, h[4] + 0.5, 0xDDCCBB, h[0], h[3] + 0.25, h[1]);
            // Window rows
            for (var w = 0; w < 3; w++) {
                makebox(1, 1.5, 0.2, 0x88AACC, h[0] - 2 + w * 2, h[3] / 2, h[1] - h[4] / 2 - 0.1);
            }
        }
        // Kiosk / ice cream stands
        makebox(2, 2.5, 2, 0xFF6699, -5, 1.35, 25);
        makecone(1.5, 1.5, 8, 0xFF3366, -5, 3, 25);
        makebox(2, 2.5, 2, 0xFFAA00, 15, 1.35, 25);
        makecone(1.5, 1.5, 8, 0xFF8800, 15, 3, 25);
        // Public toilets block
        makebox(5, 3, 4, 0xCCCCCC, -50, 1.7, 25);
        makebox(5.2, 0.3, 4.2, 0xBBBBBB, -50, 3.35, 25);
    }

    function init(scene) {
        sceneRef = scene;
        objects = [];
        i360pod = null;
        volksTrainCars = [];
        volksTrainX = -30;
        time = 0;
        i360podY = 2;
        i360podDir = 1;

        buildbeach();
        buildchannel();
        buildpalacepier();
        buildwestpier();
        buildpavillion();
        buildi360();
        buildlanes();
        buildstation();
        buildsealife();
        buildvolks();
        buildpromenade();
        buildtownscape();
    }

    function update(delta) {
        time += delta;

        // Animate i360 pod moving up/down
        if (i360pod) {
            i360podY += i360podDir * delta * 2;
            if (i360podY > 28) {
                i360podY = 28;
                i360podDir = -1;
            }
            if (i360podY < 2) {
                i360podY = 2;
                i360podDir = 1;
            }
            i360pod.position.y = i360podY + 2;
        }

        // Animate Volks Electric Railway train cars moving along track
        if (volksTrainCars.length > 0) {
            volksTrainX += delta * 4;
            if (volksTrainX > 40) {
                volksTrainX = -40;
            }
            // car1 and car1roof share same X (leading car)
            // car2 and car2roof trail 5 units behind
            if (volksTrainCars[0]) {
                volksTrainCars[0].position.x = WX + volksTrainX;
                volksTrainCars[2].position.x = WX + volksTrainX;
            }
            if (volksTrainCars[1]) {
                volksTrainCars[1].position.x = WX + volksTrainX - 5;
                volksTrainCars[3].position.x = WX + volksTrainX - 5;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            if (sceneRef) {
                sceneRef.remove(objects[i]);
            }
        }
        objects = [];
        i360pod = null;
        volksTrainCars = [];
        volksTrainX = -30;
        time = 0;
        i360podY = 2;
        i360podDir = 1;
        sceneRef = null;
    }

    return { init: init, update: update, reset: reset };

}());
