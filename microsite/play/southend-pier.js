window.SouthendPier = (function() {
    'use strict';

    var WX = 4480;
    var WZ = 2200;

    var sceneRef = null;
    var objects = [];

    // Pier railway train animation state
    var trainCars = [];
    var trainZ = 0;
    var trainDir = 1;
    var time = 0;

    // Ferris wheel animation state
    var ferrisWheel = null;
    var ferrisAngle = 0;

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

    // Feature 3: Thames Estuary — wide blue-grey water extending north
    function buildestuary() {
        // Main estuary water body, extending northward (negative Z from shore)
        makebox(220, 0.5, 80, 0x708090, 0, 0.25, -40);
        // Subtle water surface variation strips
        makebox(220, 0.15, 1, 0x607080, 0, 0.45, -20);
        makebox(220, 0.15, 1, 0x607080, 0, 0.45, -40);
        makebox(220, 0.15, 1, 0x607080, 0, 0.45, -60);
        makebox(220, 0.15, 1, 0x607080, 0, 0.45, -75);
        // Mudflat edge near shore — brown tidal flat
        makebox(220, 0.3, 6, 0x7A6A5A, 0, 0.4, -2);
    }

    // Feature 1: Southend Pier — world's longest pleasure pier
    // 1.33 miles long, built north into Thames Estuary (negative Z direction)
    function buildpier() {
        var i;
        // Main pier deck — 100 blocks of 2 units each = 200 units long
        // Split into 10 box sections of 20 each for variety
        for (i = 0; i < 10; i++) {
            makebox(3, 2, 20, 0x8B7355, 0, 2, -10 - i * 20);
        }
        // Pier support columns along length — every 10 units
        for (i = 0; i < 20; i++) {
            makebox(0.6, 4, 0.6, 0x6B5A3A, -1.2, -0.5, -5 - i * 10);
            makebox(0.6, 4, 0.6, 0x6B5A3A, 1.2, -0.5, -5 - i * 10);
        }
        // Cross-bracing horizontal bars between columns
        for (i = 0; i < 10; i++) {
            makebox(3, 0.4, 0.4, 0x7A6A48, 0, 0.5, -10 - i * 20);
        }
        // Pier railings along both sides
        makebox(0.3, 1.5, 200, 0x9A8A65, -1.6, 3.5, -100);
        makebox(0.3, 1.5, 200, 0x9A8A65, 1.6, 3.5, -100);
        // Pier railway track down the centre
        makebox(0.3, 0.15, 200, 0x555555, -0.5, 3.1, -100);
        makebox(0.3, 0.15, 200, 0x555555, 0.5, 3.1, -100);

        // Pier railway train cars — animated in update()
        var car1 = makebox(2.5, 1.8, 4, 0xCC3300, 0, 4, -20);
        var car2 = makebox(2.5, 1.8, 4, 0xCC3300, 0, 4, -25);
        var car3 = makebox(2.5, 1.8, 4, 0xCC3300, 0, 4, -30);
        // Car roofs
        var roof1 = makebox(2.7, 0.4, 4.2, 0x991100, 0, 5.1, -20);
        var roof2 = makebox(2.7, 0.4, 4.2, 0x991100, 0, 5.1, -25);
        var roof3 = makebox(2.7, 0.4, 4.2, 0x991100, 0, 5.1, -30);
        trainCars = [car1, car2, car3, roof1, roof2, roof3];
        trainZ = -20;
        trainDir = -1;
    }

    // Feature 2: Pier Head — attraction buildings at end of pier
    function buildpierhead() {
        // Main pavilion building
        makebox(18, 6, 12, 0x8B7355, 0, 4, -206);
        makebox(16, 2, 10, 0x6B5A3A, 0, 8, -206);
        // Pavilion roof suggestion
        makebox(18, 1, 12, 0x5A4A2A, 0, 10, -206);
        // Pavilion entrance
        makebox(4, 5, 1, 0x7A6A48, 0, 3.5, -200);
        // RNLI Lifeboat station — distinctive blue
        makebox(10, 5, 8, 0x002D72, -14, 3.5, -210);
        makebox(10, 1, 8, 0xFFFFFF, -14, 6.5, -210);
        // Lifeboat ramp out front
        makebox(4, 0.5, 12, 0x8B7355, -14, 1.25, -200);
        // RNLI structure — boat house doors
        makebox(4, 4, 0.5, 0xCCCCCC, -14, 3, -206);
        // Pier head café / amusement building
        makebox(12, 5, 10, 0x8B7355, 14, 3.5, -208);
        makebox(12, 0.6, 10, 0x6B5A3A, 14, 6.3, -208);
        // Flagpole at pier end
        makecylinder(0.2, 0.2, 8, 6, 0xAAAAAA, 0, 7, -214);
        makebox(3, 0.8, 0.1, 0x003399, 1.5, 12, -214);
        // Pier head platform extension
        makebox(30, 1.5, 20, 0x8B7355, 0, 2.25, -212);
        // Support columns for pier head
        var phcols = [-12, -8, -4, 0, 4, 8, 12];
        for (var i = 0; i < phcols.length; i++) {
            makebox(0.6, 5, 0.6, 0x6B5A3A, phcols[i], -0.5, -202);
            makebox(0.6, 5, 0.6, 0x6B5A3A, phcols[i], -0.5, -220);
        }
    }

    // Feature 4: Southend Seafront — Victorian hotels and buildings along shore
    function buildseafront() {
        var i;
        // Row of Victorian terraced buildings and hotels — cream coloured
        var hoteldata = [
            [-80, 10, 8, 12, 0],
            [-68, 10, 8, 14, 0],
            [-57, 10, 8, 11, 0],
            [-46, 10, 8, 13, 0],
            [-35, 10, 8, 12, 0],
            [35, 10, 8, 14, 0],
            [46, 10, 8, 12, 0],
            [57, 10, 8, 11, 0],
            [68, 10, 8, 13, 0],
            [80, 10, 8, 12, 0]
        ];
        for (i = 0; i < hoteldata.length; i++) {
            var h = hoteldata[i];
            makebox(h[1], h[3], h[2], 0xFFF8DC, h[0], h[3] / 2, 8);
            // Roof parapet
            makebox(h[1] + 0.5, 1, h[2] + 0.5, 0xEEE8CC, h[0], h[3] + 0.5, 8);
            // Chimney stacks
            makebox(1, 3, 1, 0xCCBB99, h[0] - 3, h[3] + 2, 8);
            makebox(1, 3, 1, 0xCCBB99, h[0] + 3, h[3] + 2, 8);
            // Ground floor windows
            makebox(1.5, 2, 0.2, 0xAABBCC, h[0] - 2, 2, 4.1);
            makebox(1.5, 2, 0.2, 0xAABBCC, h[0], 2, 4.1);
            makebox(1.5, 2, 0.2, 0xAABBCC, h[0] + 2, 2, 4.1);
        }
        // Promenade ground
        makebox(220, 0.3, 12, 0xBBAA88, 0, 0.35, 5);
        // Seafront road
        makebox(220, 0.3, 8, 0x888888, 0, 0.35, 15);
        // Lamp posts along promenade
        var lampx = [-70, -50, -30, -10, 10, 30, 50, 70];
        for (i = 0; i < lampx.length; i++) {
            makecylinder(0.2, 0.2, 5, 8, 0x888888, lampx[i], 2.7, 3);
            makesphere(0.5, 8, 6, 0xFFFFCC, lampx[i], 5.6, 3);
        }
        // Beach huts — colourful small boxes
        var hutsdata = [
            [-75, 0xCC4444],
            [-70, 0x44AACC],
            [-65, 0xFFCC00],
            [-60, 0x44CC44],
            [-55, 0xCC8844]
        ];
        for (i = 0; i < hutsdata.length; i++) {
            makebox(2.5, 3, 2, hutsdata[i][1], hutsdata[i][0], 1.7, 1);
            makebox(2.7, 0.6, 2.2, 0x8B7355, hutsdata[i][0], 3.3, 1);
        }
    }

    // Feature 5: Adventure Island amusement park
    function buildadventureisland() {
        var i;
        // Park boundary fence — south side of seafront
        makebox(60, 3, 1, 0xCC2200, -90, 1.7, 18);
        // Main entrance arch
        makebox(12, 6, 2, 0xFF4400, -90, 4, 22);
        makebox(10, 4, 0.3, 0xFFCC00, -90, 4, 23);
        // Roller coaster track supports — Box structures
        var rcdata = [
            [-100, 8, -110, 5, -120, 10, -115, 7, -105, 12, -95, 9]
        ];
        var rcx = [-100, -110, -120, -115, -105, -95];
        var rcy = [8, 5, 10, 7, 12, 9];
        for (i = 0; i < rcx.length; i++) {
            makebox(1, rcy[i], 1, 0xAA8833, rcx[i], rcy[i] / 2, 25);
            makebox(1, rcy[i], 1, 0xAA8833, rcx[i], rcy[i] / 2, 30);
            // Cross beam
            makebox(1, 1, 6, 0xAA8833, rcx[i], rcy[i] - 0.5, 27.5);
        }
        // Roller coaster track on top
        makebox(30, 0.5, 1, 0xCCAA44, -107, 12, 25);
        makebox(30, 0.5, 1, 0xCCAA44, -107, 12, 30);
        // Big ride box structures
        makebox(8, 12, 8, 0xFF2200, -130, 7, 24);
        makebox(10, 8, 10, 0x0044CC, -115, 5, 35);
        // Ferris wheel — CylinderGeometry as wheel body (stored for rotation)
        makecylinder(0.5, 0.5, 12, 8, 0xAAAAAA, -140, 8, 28);
        var fw = makecylinder(10, 10, 1, 20, 0xCC2200, -140, 12, 28);
        ferrisWheel = fw;
        // Ferris wheel gondolas suggestion — small boxes at cardinal points
        makebox(1.5, 1.5, 1, 0xFFFF00, -140, 22, 28);
        makebox(1.5, 1.5, 1, 0xFFFF00, -140, 2, 28);
        makebox(1.5, 1.5, 1, 0xFFFF00, -150, 12, 28);
        makebox(1.5, 1.5, 1, 0xFFFF00, -130, 12, 28);
        // Bumper cars building
        makebox(14, 4, 12, 0x004499, -100, 3, 32);
        // Water ride trough support boxes
        makebox(6, 2, 20, 0x006644, -85, 2, 30);
        // Food stalls row
        var stallx = [-95, -90, -85];
        for (i = 0; i < stallx.length; i++) {
            makebox(3, 3.5, 3, 0xFF8800, stallx[i], 1.85, 22);
            makecone(2.2, 2, 8, 0xFF4400, stallx[i], 4.5, 22);
        }
        // Park lighting poles
        makecylinder(0.25, 0.25, 9, 8, 0x888888, -120, 4.7, 22);
        makecylinder(0.25, 0.25, 9, 8, 0x888888, -100, 4.7, 35);
        makesphere(0.8, 8, 6, 0xFFFFCC, -120, 9.9, 22);
        makesphere(0.8, 8, 6, 0xFFFFCC, -100, 9.9, 35);
    }

    // Feature 6: Kursaal dome — 1901 entertainment venue, now bowling alley
    function buildkursaal() {
        // Main building body
        makebox(30, 10, 20, 0xFFFFFF, 50, 6, 25);
        // Upper drum below dome
        makecylinder(7, 8, 4, 16, 0xFFFFFF, 50, 12, 25);
        // The famous dome — large white cylinder topped with sphere suggestion
        makecylinder(8, 7, 6, 16, 0xFFFFFF, 50, 16, 25);
        makecylinder(7, 4, 3, 16, 0xF0F0F0, 50, 20, 25);
        makecylinder(4, 0.5, 2, 16, 0xEEEEEE, 50, 23, 25);
        makecone(1, 3, 12, 0xDDDDDD, 50, 25.5, 25);
        // Side wings
        makebox(10, 8, 18, 0xFFFFFF, 35, 5, 25);
        makebox(10, 8, 18, 0xFFFFFF, 65, 5, 25);
        // Entrance portico
        makebox(8, 6, 3, 0xEEEEEE, 50, 4, 14);
        makecylinder(0.8, 0.8, 6, 8, 0xDDDDDD, 46, 3.5, 14);
        makecylinder(0.8, 0.8, 6, 8, 0xDDDDDD, 54, 3.5, 14);
        // Windows
        var winx = [38, 43, 48, 53, 58, 63];
        for (var i = 0; i < winx.length; i++) {
            makebox(2, 3, 0.2, 0xCCDDEE, winx[i], 5, 14.9);
        }
        // Ground around Kursaal
        makebox(40, 0.2, 25, 0x888888, 50, 0.1, 22);
    }

    // Feature 7: Cliffs Pavilion — clifftop theatre
    function buildcliffspavilion() {
        // Theatre sits on clifftop — raised base
        makebox(30, 8, 15, 0x808080, -50, 12, 50);
        // Modern concrete walls
        makebox(28, 4, 13, 0x909090, -50, 20, 50);
        // Curved roof suggestion — cylinders
        makecylinder(15, 15, 3, 16, 0x777777, -50, 25.5, 50);
        makecylinder(13, 15, 2, 16, 0x888888, -50, 27, 50);
        // Stage fly tower — tall box at rear
        makebox(15, 18, 10, 0x707070, -50, 17, 55);
        // Cliff face below pavilion
        makebox(30, 10, 5, 0x9A8A7A, -50, 7, 47);
        // Entrance foyer glass front suggestion
        makebox(20, 6, 2, 0x99AACC, -50, 11, 43);
        // Pavilion gardens / car park box
        makebox(35, 0.2, 20, 0x888888, -50, 8.1, 62);
        // Signage box
        makebox(12, 2, 0.3, 0x808080, -50, 15, 43);
        // Access ramp from road
        makebox(6, 2, 10, 0x888888, -40, 9, 53);
    }

    // Feature 8: Sealife Southend aquarium
    function buildsealife() {
        // Main aquarium building — deep blue
        makebox(20, 7, 12, 0x006994, 25, 4.5, 10);
        // Upper section
        makebox(18, 3, 10, 0x005580, 25, 9, 10);
        // Tank dome structure on roof
        makecylinder(4, 4, 3, 12, 0x007BB5, 25, 12, 10);
        makecylinder(3, 4, 1, 12, 0x006994, 25, 14, 10);
        // Entrance tunnel box
        makebox(4, 4, 5, 0x005580, 15, 2.5, 10);
        makesphere(2, 10, 8, 0x004466, 15, 4.5, 10);
        // Sea creature motif panels on walls
        makebox(3, 3, 0.2, 0x0088CC, 22, 5, 4.1);
        makebox(3, 3, 0.2, 0x0088CC, 28, 5, 4.1);
        // Blue sign
        makebox(8, 1.5, 0.3, 0x0099CC, 25, 9, 4.1);
        // Tank windows facing seafront
        var swtx = [20, 23, 26, 29, 32];
        for (var i = 0; i < swtx.length; i++) {
            makebox(2, 2.5, 0.2, 0x44AACC, swtx[i], 4.5, 4.1);
        }
        // Outdoor rock pool area
        makebox(8, 0.5, 6, 0x8B8070, 35, 0.35, 8);
    }

    // Feature 9: Thames shipping — cargo ships in the estuary
    function buildshipping() {
        var i;
        // Ship 1 — large cargo vessel heading west
        makebox(50, 5, 10, 0x808080, -40, 3.5, -50);
        // Ship 1 superstructure
        makebox(12, 8, 8, 0x888888, -25, 8, -50);
        // Ship 1 smokestacks
        makecylinder(1.2, 1.2, 7, 8, 0x555555, -22, 13.5, -50);
        makecylinder(1.2, 1.2, 7, 8, 0x555555, -27, 13.5, -50);
        // Ship 1 hull detail — waterline stripe
        makebox(50, 0.5, 0.3, 0xCC3300, -40, 1.5, -45.1);
        makebox(50, 0.5, 0.3, 0xCC3300, -40, 1.5, -54.9);
        // Cargo containers on deck — coloured boxes
        var cargocols = [0xCC4400, 0x4444CC, 0x44AA44, 0xCCAA00];
        for (i = 0; i < 4; i++) {
            makebox(6, 3, 8, cargocols[i], -55 + i * 7, 6.5, -50);
        }

        // Ship 2 — smaller vessel further out
        makebox(40, 4, 8, 0x777777, 60, 3, -65);
        makebox(10, 7, 7, 0x888888, 72, 7, -65);
        makecylinder(1, 1, 6, 8, 0x444444, 70, 11, -65);
        makebox(40, 0.4, 0.3, 0xCC2200, 60, 1.3, -61.1);
        makebox(40, 0.4, 0.3, 0xCC2200, 60, 1.3, -68.9);

        // Ship 3 — moored tanker
        makebox(55, 4.5, 12, 0x666666, -30, 3.25, -75);
        makebox(14, 9, 10, 0x777777, -15, 8, -75);
        makecylinder(1.5, 1.5, 8, 8, 0x333333, -12, 14, -75);
        makecylinder(1.5, 1.5, 8, 8, 0x333333, -18, 14, -75);
        // Tanker pipeline on deck
        makebox(30, 0.6, 0.6, 0x999999, -35, 6.3, -75);

        // Navigation buoy — red cylinder
        makecylinder(1.5, 1.5, 2, 10, 0xCC0000, 20, 1.5, -45);
        makecone(0.8, 2, 8, 0xCC0000, 20, 3.5, -45);
    }

    // Feature 10: Leigh-on-Sea — old fishing village
    function buildleighonsea() {
        var i;
        // Fishermen's cottages — old brown
        var cottagedata = [
            [-160, 6, 6, 5, 0x8B6914],
            [-168, 6, 6, 5, 0x7A5A10],
            [-152, 7, 7, 4, 0x8B6914],
            [-175, 6, 6, 5, 0x8B7A55],
            [-145, 6, 6, 4, 0x7A6A45]
        ];
        for (i = 0; i < cottagedata.length; i++) {
            var c = cottagedata[i];
            makebox(c[1], c[3], c[2], c[4], c[0], c[3] / 2, 10);
            // Cottage roof — pitched box
            makebox(c[1] + 0.5, 2, c[2] + 0.5, 0x5A3A10, c[0], c[3] + 1, 10);
            // Chimney
            makecylinder(0.4, 0.4, 2.5, 6, 0x5A4A30, c[0] + 1.5, c[3] + 2.5, 10);
        }

        // Cockle sheds — characteristic low brown buildings
        var sheddata = [
            [-155, 10, 4, 3],
            [-162, 10, 4, 3],
            [-170, 10, 4, 3],
            [-178, 8, 4, 3]
        ];
        for (i = 0; i < sheddata.length; i++) {
            var s = sheddata[i];
            makebox(s[1], s[3], s[2], 0x8B4513, s[0], s[3] / 2, 18);
            makebox(s[1] + 0.3, 0.8, s[2] + 0.3, 0x6B3410, s[0], s[3] + 0.4, 18);
        }

        // Boats pulled up on mud — assorted small box hulls
        var boatdata = [
            [-158, 0x6B5A3A],
            [-163, 0x4A6A8B],
            [-169, 0x5A8B3A],
            [-174, 0x8B6B3A]
        ];
        for (i = 0; i < boatdata.length; i++) {
            makebox(6, 1.5, 2.5, boatdata[i][1], boatdata[i][0], 1.25, 0);
            makebox(6, 0.5, 2.7, 0x5A4A2A, boatdata[i][0], 2.25, 0);
            // Mast
            makecylinder(0.15, 0.15, 5, 6, 0x8B7355, boatdata[i][0], 5, 0);
        }

        // Old quay wall — stone box
        makebox(50, 3, 3, 0x8B8070, -163, 2, 4);
        // Leigh-on-Sea station building (small)
        makebox(8, 5, 6, 0xCCBB88, -185, 3.5, 15);
        makebox(8.5, 0.6, 6.5, 0xBBAA77, -185, 6.3, 15);
        // Old High Street narrow buildings
        makebox(5, 7, 5, 0xCC9966, -190, 4.5, 12);
        makebox(5, 6, 5, 0xBB8855, -196, 4, 12);
        makebox(5, 8, 5, 0xCC9966, -202, 5, 12);
        // Pub sign post
        makecylinder(0.2, 0.2, 4, 6, 0x8B6914, -188, 2.5, 8);
        makebox(2, 1.2, 0.2, 0x6B3410, -188, 5, 8);
        // Mud flat extending south from village
        makebox(70, 0.3, 8, 0x9A8A6A, -165, 0.25, -3);
    }

    // Ground / shore base around the area
    function buildground() {
        // Main shore ground
        makebox(220, 0.5, 30, 0xA09080, 0, 0.25, 18);
        // Extended ground behind seafront
        makebox(220, 0.5, 50, 0x888878, 0, 0.25, 40);
        // Cliffs east side rising ground
        makebox(60, 4, 20, 0x9A8A7A, -50, 2, 55);
        makebox(60, 8, 15, 0x9A8A7A, -50, 5, 65);
    }

    function init(scene) {
        sceneRef = scene;
        objects = [];
        trainCars = [];
        trainZ = -20;
        trainDir = -1;
        ferrisWheel = null;
        ferrisAngle = 0;
        time = 0;

        buildground();
        buildestuary();
        buildpier();
        buildpierhead();
        buildseafront();
        buildadventureisland();
        buildkursaal();
        buildcliffspavilion();
        buildsealife();
        buildshipping();
        buildleighonsea();
    }

    function update(delta) {
        time += delta;

        // Animate pier railway train cars moving along pier (Z axis)
        if (trainCars.length > 0) {
            trainZ += trainDir * delta * 8;
            // Pier runs from z=0 to z=-200 (local), train bounces end to end
            if (trainZ < -190) {
                trainZ = -190;
                trainDir = 1;
            }
            if (trainZ > -5) {
                trainZ = -5;
                trainDir = -1;
            }
            // Cars 0,1,2 = bodies; 3,4,5 = roofs. Space 5 units apart along Z
            if (trainCars[0]) {
                trainCars[0].position.z = WZ + trainZ;
                trainCars[3].position.z = WZ + trainZ;
            }
            if (trainCars[1]) {
                trainCars[1].position.z = WZ + trainZ - 5 * trainDir;
                trainCars[4].position.z = WZ + trainZ - 5 * trainDir;
            }
            if (trainCars[2]) {
                trainCars[2].position.z = WZ + trainZ - 10 * trainDir;
                trainCars[5].position.z = WZ + trainZ - 10 * trainDir;
            }
        }

        // Animate ferris wheel rotation
        if (ferrisWheel) {
            ferrisAngle += delta * 0.4;
            ferrisWheel.rotation.z = ferrisAngle;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            if (sceneRef) {
                sceneRef.remove(objects[i]);
            }
        }
        objects = [];
        trainCars = [];
        trainZ = -20;
        trainDir = -1;
        ferrisWheel = null;
        ferrisAngle = 0;
        time = 0;
        sceneRef = null;
    }

    return { init: init, update: update, reset: reset };

}());
